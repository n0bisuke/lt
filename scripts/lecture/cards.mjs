// deck.md の <!-- card: URL --> を、プレビューカードに展開する。
// 使い方: npm run cards [-- ファイル...] [-- --refresh]
// 画像は deck.md と同じ階層の images/cards/ に保存するので、一度展開すればオフラインでも表示できる。
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lectureDecks, root } from './decks.mjs';
const USER_AGENT = 'n0bisuke-lt-slides-card/1.0';
const TIMEOUT_MS = 15000;
const MAX_HTML = 2 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const CARD_LINE = /^<!--\s*card:\s*(.*?)\s*-->\s*$/;
const GENERATED = /^<article class="gl-linkcard[^"]*"[^>]*data-card="([^"]*)"[^>]*>/;

// カードの文字は外部サイトの内容なので、必ずエスケープする。
// # も符号化し、見出しや自動チェックに誤認されないようにする。
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/#(?!\d+;|39;)/g, '&#35;');

function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return named[e.toLowerCase()] ?? m;
    const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
  });
}

function isPrivateAddress(ip) {
  if (ip === '::1' || ip === '::') return true;
  const v4 = ip.replace(/^::ffff:/i, '');
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return /^(fc|fd|fe80)/i.test(ip);
}

async function assertPublicUrl(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`未対応のURLです: ${url.protocol}`);
  if (process.env.CARDS_ALLOW_LOCAL === '1') return;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('ローカルのURLは使えません');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new Error('内部ネットワークのURLは使えません');
}

async function readLimited(res, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > limit) {
      if (limit === MAX_HTML) break; // HTMLは先頭だけあればよい
      throw new Error('ファイルが大きすぎます');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function get(startUrl, limit) {
  let url = new URL(startUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,image/*;q=0.9,*/*;q=0.5' },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { url, type: (res.headers.get('content-type') ?? '').toLowerCase(), body: await readLimited(res, limit) };
  }
  throw new Error('リダイレクトが多すぎます');
}

// 中身のバイト列で判定する。SVGはスクリプトを含められるので受け付けない。
function imageExt(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

function decodeHtml(body, type) {
  const head = body.subarray(0, 4096).toString('latin1');
  const charset = type.match(/charset=["']?([\w-]+)/)?.[1] ?? head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}

function parseMeta(html) {
  const meta = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find((v) => v !== undefined);
    const key = (attr('property') ?? attr('name'))?.toLowerCase();
    const content = attr('content');
    if (key && content && !(key in meta)) meta[key] = decodeEntities(content).trim();
  }
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return {
    title: meta['og:title'] ?? meta['twitter:title'] ?? (title ? decodeEntities(title).replace(/\s+/g, ' ').trim() : ''),
    site: meta['og:site_name'] ?? '',
    image: meta['og:image:secure_url'] ?? meta['og:image'] ?? meta['twitter:image'] ?? '',
    date: (meta['article:published_time'] ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '',
  };
}

function saveImage(file, source, bytes, ext) {
  const dir = join(dirname(file), 'images/cards');
  mkdirSync(dir, { recursive: true });
  const name = `${createHash('sha1').update(source).digest('hex').slice(0, 12)}.${ext}`;
  writeFileSync(join(dir, name), bytes);
  return `images/cards/${name}`;
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function missingCard(label) {
  const text = label || '画像未設定';
  return `<article class="gl-linkcard is-missing" data-card="${esc(label)}"><div class="gl-shot t-note">${esc(text)}</div></article>`;
}

function failedCard(source, reason) {
  return `<article class="gl-linkcard" data-card="${esc(source)}" data-status="failed"><strong class="t-sub">取得できませんでした（要確認）</strong><small class="t-note gl-muted"><a href="${esc(source)}">${esc(clip(source, 80))}</a><br>${esc(reason)}</small></article>`;
}

async function buildCard(file, source) {
  const page = await get(source, MAX_IMAGE);
  const host = page.url.hostname.replace(/^www\./, '');
  const direct = imageExt(page.body);
  if (direct) {
    const src = saveImage(file, source, page.body, direct);
    return `<article class="gl-linkcard is-image" data-card="${esc(source)}"><img src="${esc(src)}" alt=""><small class="t-note gl-muted">出典: <a href="${esc(source)}">${esc(host)}</a></small></article>`;
  }
  if (!page.type.includes('html')) throw new Error(`画像でもWebページでもありません（${page.type || '形式不明'}）`);
  const meta = parseMeta(decodeHtml(page.body.subarray(0, MAX_HTML), page.type));
  let img = '';
  if (meta.image) {
    try {
      const imageUrl = new URL(meta.image, page.url).href;
      const res = await get(imageUrl, MAX_IMAGE);
      const ext = imageExt(res.body);
      if (ext) img = `<img src="${esc(saveImage(file, source, res.body, ext))}" alt="">`;
    } catch {
      // サムネイルが取れなくても、文字だけのカードにする
    }
  }
  const title = clip(meta.title || host, 120);
  const by = [meta.site || host, meta.date].filter(Boolean).join(' / ');
  return `<article class="gl-linkcard" data-card="${esc(source)}">${img}<strong class="t-sub"><a href="${esc(source)}">${esc(title)}</a></strong><small class="t-note gl-muted">${esc(by)}</small></article>`;
}

const isUrl = (s) => /^https?:\/\//i.test(s);

// 手元の画像: <!-- card: images/foo.jpg | 説明 -->
const LOCAL = /^(images\/[^\s|]+\.(?:jpe?g|png|gif|webp))(?:\s*\|\s*(.+))?$/i;

function localCard(file, source, m) {
  if (m[1].includes('..') || !existsSync(join(dirname(file), m[1]))) return missingCard(source);
  const caption = m[2] ? `<small class="t-note gl-muted">${esc(m[2])}</small>` : '';
  return `<article class="gl-linkcard is-image" data-card="${esc(source)}"><img src="${esc(m[1])}" alt="">${caption}</article>`;
}

// 1ファイルを処理する。内容が変わったときだけ書き込む。
export async function processFile(file, { refresh = false, log = console.log } = {}) {
  const before = readFileSync(file, 'utf8');
  const lines = before.split('\n');
  const out = [];
  let fenced = false;
  const stats = { cards: 0, missing: 0, failed: 0 };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    out.push(line);
    if (/^\s*```/.test(line)) fenced = !fenced;
    const m = !fenced && line.match(CARD_LINE);
    if (!m) continue;
    const source = m[1];
    const next = lines[i + 1] ?? '';
    const generated = next.match(GENERATED);
    const unchanged = generated && decodeEntities(generated[1]) === source;
    const failedBefore = generated && next.includes('data-status="failed"');
    if (generated) i += 1;
    const local = source.match(LOCAL);
    if (local) {
      out.push(localCard(file, source, local));
    } else if (unchanged && !refresh && !failedBefore) {
      out.push(next);
    } else if (!isUrl(source)) {
      out.push(missingCard(source));
    } else {
      try {
        out.push(await buildCard(file, source));
        log(`カードを作成: ${source}`);
      } catch (err) {
        out.push(failedCard(source, err.message));
        log(`取得に失敗: ${source} (${err.message})`);
      }
    }
    const made = out[out.length - 1];
    stats.cards += 1;
    if (made.includes('is-missing')) stats.missing += 1;
    if (made.includes('data-status="failed"')) stats.failed += 1;
  }
  const after = out.join('\n');
  if (after !== before) writeFileSync(file, after);
  return stats;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export const defaultFiles = () => lectureDecks();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const named = args.filter((a) => !a.startsWith('--')).map((a) => resolve(a));
  const total = { cards: 0, missing: 0, failed: 0 };
  for (const file of named.length ? named : defaultFiles()) {
    const s = await processFile(file, { refresh });
    if (s.missing || s.failed) console.log(`${relative(root, file)}: 未設定 ${s.missing} 件 / 取得失敗 ${s.failed} 件`);
    for (const k of Object.keys(total)) total[k] += s[k];
  }
  console.log(`カード ${total.cards} 件（未設定 ${total.missing} 件 / 取得失敗 ${total.failed} 件）`);
}

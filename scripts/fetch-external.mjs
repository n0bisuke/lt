#!/usr/bin/env node
// Speaker Deck と Qiita スライドの公開情報を external.json に保存する。
// SlideShare はスクリプトからの取得をボット対策で止められるので、external.json に手で書いた分をそのまま残す。
// サイトの一覧はこのファイルから作るので、GitHub Actions は外部サイトにアクセスしない。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'external.json');
const SPEAKERDECK_USERS = ['n0bisuke', 'n0bisuke2'];
const QIITA_USER = 'n0bisuke';
const HEADERS = { 'User-Agent': 'n0bisuke-lt-slide-index' };

const unescapeXml = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');
const dateJst = (s) => new Date(s).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

async function speakerDeck(user) {
  const decks = [];
  for (let page = 1; ; page++) {
    const xml = await (await get(`https://speakerdeck.com/${user}.atom?page=${page}`)).text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    if (!entries.length) return decks;
    for (const e of entries) {
      const url = /<link rel="alternate"[^>]*href="([^"]+)"/.exec(e)?.[1];
      const title = /<title>([\s\S]*?)<\/title>/.exec(e)?.[1];
      const published = /<published>([^<]+)<\/published>/.exec(e)?.[1];
      const thumbnail = /<media:thumbnail url="([^"]+)"/.exec(e)?.[1];
      if (!url || !title || !published || !thumbnail) throw new Error(`Speaker Deck の項目を読めません: ${url ?? e.slice(0, 120)}`);
      decks.push({ source: 'speakerdeck', title: unescapeXml(title).trim(), date: dateJst(published), url, thumbnail: unescapeXml(thumbnail) });
    }
  }
}

async function qiitaSlides(known) {
  const decks = [];
  for (let page = 1; ; page++) {
    const items = await (await get(`https://qiita.com/api/v2/users/${QIITA_USER}/items?per_page=100&page=${page}`)).json();
    if (!items.length) return decks;
    for (const item of items.filter((i) => i.slide)) {
      // サムネイルは記事ページの OGP 画像。取得済みのものは読み直さない
      let thumbnail = known.get(item.url)?.thumbnail;
      if (!thumbnail) {
        const html = await (await get(item.url)).text();
        thumbnail = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
        if (!thumbnail) throw new Error(`Qiita のサムネイルが見つかりません: ${item.url}`);
        thumbnail = unescapeXml(thumbnail);
      }
      decks.push({ source: 'qiita', title: item.title.trim(), date: dateJst(item.created_at), url: item.url, thumbnail });
    }
  }
}

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).decks : [];
const known = new Map(previous.map((d) => [d.url, d]));
const decks = [];
for (const user of SPEAKERDECK_USERS) decks.push(...await speakerDeck(user));
// Qiita の API は1ページに1分近くかかるので、--speakerdeck-only では前回の内容を使う
if (process.argv.includes('--speakerdeck-only')) decks.push(...previous.filter((d) => d.source === 'qiita'));
else decks.push(...await qiitaSlides(known));
// SlideShare は取得できないので前回の内容を使う
decks.push(...previous.filter((d) => d.source === 'slideshare'));
decks.sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));

writeFileSync(OUT, JSON.stringify({ decks }, null, 2) + '\n');
const count = (s) => decks.filter((d) => d.source === s).length;
console.log(`external.json: Speaker Deck ${count('speakerdeck')} 本、Qiita ${count('qiita')} 本、SlideShare ${count('slideshare')} 本`);

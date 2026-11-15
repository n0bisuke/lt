#!/usr/bin/env node
// usage: npm run deck -- decks
// デッキをビルドし、localhost で配信する。ブラウザーは別途開く。
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySlideAdjustments, parseDeck, renderSlides } from './lib/deck.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const decksRoot = join(root, 'decks');
const distRoot = join(root, 'dist');
const target = resolve(process.argv[2] ?? '');
if (target !== decksRoot) {
  console.error('使い方: npm run deck -- decks');
  process.exit(1);
}

const deckDirs = new Set();
function collectDeckDirs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === 'deck.md')) {
    const markdown = join(dir, 'deck.md');
    deckDirs.add(dir);
    if (parseDeck(readFileSync(markdown, 'utf8')).meta.variants === true) return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    collectDeckDirs(join(dir, entry.name));
  }
}

function buildDeck(dir) {
  const sourcePath = join(dir, 'deck.md');
  const source = readFileSync(sourcePath, 'utf8');
  const { meta } = parseDeck(source);
  if (meta.variants === true) {
    const rendered = renderSlides(source, { title: meta.title ?? '' });
    const adjustmentsPath = join(dir, '.lt-adjustments.json');
    const adjustments = existsSync(adjustmentsPath) ? JSON.parse(readFileSync(adjustmentsPath, 'utf8')) : {};
    const html = applySlideAdjustments(rendered.html, adjustments);
    writeFileSync(join(dir, 'deck.html'), html);
    console.log(`${sourcePath}（${rendered.count} 枚・親デッキ）`);
    return;
  }
  const result = spawnSync(process.execPath, ['scripts/build-deck.mjs', dir], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`${dir} のビルドに失敗しました`);
}

function rebuildAll() {
  deckDirs.clear();
  collectDeckDirs(decksRoot);
  const publishedTitles = new Set([...deckDirs]
    .map((dir) => ({ dir, meta: parseDeck(readFileSync(join(dir, 'deck.md'), 'utf8')).meta }))
    .filter(({ meta }) => meta.published === true)
    .map(({ meta }) => meta.title));
  for (const dir of [...deckDirs]) {
    const { meta } = parseDeck(readFileSync(join(dir, 'deck.md'), 'utf8'));
    if (meta.published !== true && publishedTitles.has(meta.title)) deckDirs.delete(dir);
  }
  for (const dir of deckDirs) buildDeck(dir);
  const site = spawnSync(process.execPath, ['scripts/build-site.mjs', '--preview', '--skip-variants'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (site.status !== 0) throw new Error('記事プレビューの生成に失敗しました');
}

rebuildAll();

const markdownSnapshots = new Map();
function snapshotDeckMarkdown(dir) {
  const markdown = join(dir, 'deck.md');
  if (existsSync(markdown)) markdownSnapshots.set(markdown, readFileSync(markdown, 'utf8'));
  if (existsSync(markdown) && parseDeck(readFileSync(markdown, 'utf8')).meta.variants === true) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    snapshotDeckMarkdown(join(dir, entry.name));
  }
}
snapshotDeckMarkdown(decksRoot);

function rebuildChangedMarkdown(files) {
  const changedFiles = [...files].filter((file) => deckDirs.has(dirname(file))
    && (!existsSync(file) || readFileSync(file, 'utf8') !== markdownSnapshots.get(file)));
  if (!changedFiles.length) return false;

  const affected = new Set();
  let needsFullRebuild = false;
  for (const file of changedFiles) {
    if (!existsSync(file)) {
      markdownSnapshots.delete(file);
      needsFullRebuild = true;
      continue;
    }
    const previous = markdownSnapshots.get(file);
    const current = readFileSync(file, 'utf8');
    const beforeMeta = previous === undefined ? null : parseDeck(previous).meta;
    const afterMeta = parseDeck(current).meta;
    markdownSnapshots.set(file, current);

    if (previous === undefined || JSON.stringify(beforeMeta) !== JSON.stringify(afterMeta)) {
      needsFullRebuild = true;
      continue;
    }
    if (afterMeta.variants === true) {
      affected.add(dirname(file));
    } else {
      const dir = dirname(file);
      if (!deckDirs.has(dir)) needsFullRebuild = true;
      else affected.add(dir);
    }
  }

  if (needsFullRebuild) {
    rebuildAll();
    markdownSnapshots.clear();
    snapshotDeckMarkdown(decksRoot);
    return true;
  }

  for (const dir of affected) buildDeck(dir);
  const site = spawnSync(process.execPath, ['scripts/build-site.mjs', '--preview', '--skip-variants'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (site.status !== 0) throw new Error('記事プレビューの生成に失敗しました');
  return true;
}

const allDecks = [...deckDirs].map((dir) => {
  const md = readFileSync(join(dir, 'deck.md'), 'utf8');
  const { meta } = parseDeck(md);
  return {
    dir,
    title: meta.title || dir.split(sep).at(-1),
    route: meta.path ?? meta.id ?? dir.split(sep).at(-1),
    published: meta.published === true,
  };
});
const decks = allDecks;

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const listPage = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LTデッキ一覧</title><style>body{font:18px/1.7 system-ui,sans-serif;max-width:900px;margin:48px auto;padding:0 24px;color:#171717}h1{font-size:30px}li{margin:8px 0}a{color:inherit;margin-right:16px}</style><h1>ローカルのLTデッキ</h1><ul>${decks.map(({ dir, title, route, published }) => {
  const path = dir.slice(root.length + 1).split(sep).map(encodeURIComponent).join('/');
  const routePath = String(route).split('/').map(encodeURIComponent).join('/');
  return `<li><a href="/${path}/deck.html">スライド：${escapeHtml(title)}</a>${published ? `<a href="/${routePath}/">詳細・版を選ぶ</a>` : ''}</li>`;
}).join('')}</ul></html>`;

const reloadClients = new Set();
const reloadScript = '<script>new EventSource("/__preview-reload").onmessage=()=>location.reload()</script>';
const editorScript = '<script src="/__preview-editor.js"></script>';
const clients = `data: reload\n\n`;

function adjustmentFile(dir) { return join(dir, '.lt-adjustments.json'); }
function readAdjustments(dir) {
  const path = adjustmentFile(dir);
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return {}; }
}

function readRequest(req, res) {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (part) => {
    body += part;
    if (body.length > 32_768) { res.writeHead(413).end('Too large'); req.destroy(); }
  });
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const dir = resolve(root, payload.deck ?? '');
      if (!deckDirs.has(dir) || !dir.startsWith(`${decksRoot}${sep}`)) throw new Error('Unknown deck');
      if (!/^\d+:\d+:(?:\d+\.)*\d+$/.test(payload.key ?? '')) throw new Error('Invalid target');
      if (payload.reset === true) {
        const adjustments = readAdjustments(dir);
        delete adjustments[payload.key];
        writeFileSync(adjustmentFile(dir), `${JSON.stringify(adjustments, null, 2)}\n`);
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(adjustments));
        return;
      }
      const { x, y, width, height } = payload.adjustment ?? {};
      if (![x, y].every((n) => Number.isFinite(n) && Math.abs(n) <= 3000)
        || ![width, height].every((n) => n === null || (Number.isFinite(n) && n >= 24 && n <= 4000))) {
        throw new Error('Invalid adjustment');
      }
      const adjustments = readAdjustments(dir);
      adjustments[payload.key] = { x: Math.round(x), y: Math.round(y), width: width === null ? null : Math.round(width), height: height === null ? null : Math.round(height) };
      writeFileSync(adjustmentFile(dir), `${JSON.stringify(adjustments, null, 2)}\n`);
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(adjustments));
    } catch (error) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end(error.message);
    }
  });
}

let rebuildTimer;
const pendingMarkdown = new Set();
function scheduleRebuild(file) {
  pendingMarkdown.add(file);
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    try {
      if (!rebuildChangedMarkdown(pendingMarkdown)) return;
      for (const response of reloadClients) response.write(clients);
      console.log(`変更したデッキを再ビルドしました（${pendingMarkdown.size} ファイル）。プレビューを更新します。`);
    } catch (error) {
      console.error(error.message);
    } finally {
      pendingMarkdown.clear();
    }
  }, 180);
}

watch(decksRoot, { recursive: true }, (_event, filename) => {
  if (!filename || basename(String(filename)) !== 'deck.md') return;
  const file = resolve(decksRoot, String(filename));
  if (!file.startsWith(`${decksRoot}${sep}`)) return;
  // deck.md 以外は無視し、生成された版の同じ内容の通知も再ビルドしない。
  scheduleRebuild(file);
});

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === '/__preview-reload') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    reloadClients.add(res);
    req.on('close', () => reloadClients.delete(res));
    return;
  }

  if (pathname === '/__preview-editor.js') {
    res.writeHead(200, { 'content-type': types['.js'] });
    createReadStream(join(root, 'scripts/preview-editor.js')).pipe(res);
    return;
  }
  if (pathname === '/__preview-adjustments' && req.method === 'GET') {
    const deck = new URL(req.url, 'http://localhost').searchParams.get('deck') ?? '';
    const dir = resolve(root, deck);
    if (!deckDirs.has(dir) || !dir.startsWith(`${decksRoot}${sep}`)) { res.writeHead(404).end('Unknown deck'); return; }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(readAdjustments(dir)));
    return;
  }
  if (pathname === '/__preview-adjustments' && req.method === 'POST') {
    readRequest(req, res);
    return;
  }

  if (pathname === '/decks' || pathname === '/decks/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(listPage);
    return;
  }

  let sitePath = pathname.replace(/^\/+/, '');
  if (!sitePath || sitePath.endsWith('/')) sitePath += 'index.html';
  const siteFile = resolve(distRoot, sitePath);
  if (siteFile.startsWith(`${distRoot}${sep}`) && existsSync(siteFile) && statSync(siteFile).isFile()) {
    res.writeHead(200, { 'content-type': types[extname(siteFile).toLowerCase()] ?? 'application/octet-stream' });
    createReadStream(siteFile).pipe(res);
    return;
  }

  let file = resolve(root, `.${pathname}`);
  const inside = (directory) => file.startsWith(`${directory}${sep}`);
  const pathParts = file.slice(decksRoot.length + 1).split(sep);
  const isDeckPage = ['deck.html', 'index.html'].includes(pathParts.at(-1));
  const isDeckImage = pathParts.includes('images');
  const allowed = inside(join(root, 'design-system'))
    || (inside(decksRoot) && (isDeckPage || isDeckImage));
  if (!allowed || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('Not found');
    return;
  }

  res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] ?? 'application/octet-stream' });
  if (file.endsWith('deck.html')) {
    const deck = relative(root, dirname(file)).split(sep).join('/');
    const adjustmentJson = JSON.stringify(readAdjustments(dirname(file))).replaceAll('<', '\\u003c');
    const state = `<script>window.LT_PREVIEW_DECK=${JSON.stringify(deck)};window.LT_ADJUSTMENTS=${adjustmentJson}</script>`;
    res.end(readFileSync(file, 'utf8').replace('</body>', `${state}${editorScript}${reloadScript}</body>`));
    return;
  }
  createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`ローカルプレビュー: http://127.0.0.1:${port}/decks/`);
  console.log('終了するには Ctrl+C を押してください。');
});

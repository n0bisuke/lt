#!/usr/bin/env node
// usage: npm run deck -- decks
// デッキをビルドし、localhost で配信する。ブラウザーは別途開く。
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVariants, findVariantMasters } from './lecture/build-variants.mjs';
import { parseDeck } from './lib/deck.mjs';

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
    if (parseDeck(readFileSync(markdown, 'utf8')).meta.variants !== true) deckDirs.add(dir);
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    collectDeckDirs(join(dir, entry.name));
  }
}

function buildDeck(dir) {
  const result = spawnSync(process.execPath, ['scripts/build-deck.mjs', dir], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`${dir} のビルドに失敗しました`);
}

function rebuildAll() {
  for (const master of findVariantMasters()) buildVariants(master);
  deckDirs.clear();
  collectDeckDirs(decksRoot);
  for (const dir of deckDirs) buildDeck(dir);
  const site = spawnSync(process.execPath, ['scripts/build-site.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (site.status !== 0) throw new Error('記事プレビューの生成に失敗しました');
}

rebuildAll();

const decks = [...deckDirs].map((dir) => {
  const md = readFileSync(join(dir, 'deck.md'), 'utf8');
  const { meta } = parseDeck(md);
  return {
    dir,
    title: meta.title || dir.split(sep).at(-1),
    route: meta.path ?? meta.id ?? dir.split(sep).at(-1),
    published: meta.published === true,
  };
});

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const listPage = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LTデッキ一覧</title><style>body{font:18px/1.7 system-ui,sans-serif;max-width:900px;margin:48px auto;padding:0 24px;color:#171717}h1{font-size:30px}li{margin:8px 0}a{color:inherit;margin-right:16px}</style><h1>ローカルのLTデッキ</h1><ul>${decks.map(({ dir, title, route, published }) => {
  const path = dir.slice(root.length + 1).split(sep).map(encodeURIComponent).join('/');
  const routePath = String(route).split('/').map(encodeURIComponent).join('/');
  return `<li><a href="/${path}/deck.html">スライド：${escapeHtml(title)}</a>${published ? `<a href="/${routePath}/">記事</a>` : ''}</li>`;
}).join('')}</ul></html>`;

const reloadClients = new Set();
const reloadScript = '<script>new EventSource("/__preview-reload").onmessage=()=>location.reload()</script>';
const clients = `data: reload\n\n`;

let rebuildTimer;
let rebuilding = false;
let rebuildAgain = false;
function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    if (rebuilding) { rebuildAgain = true; return; }
    rebuilding = true;
    try {
      rebuildAll();
      for (const response of reloadClients) response.write(clients);
      console.log('Markdown を再ビルドしました。プレビューを更新します。');
    } catch (error) {
      console.error(error.message);
    } finally {
      rebuilding = false;
      if (rebuildAgain) { rebuildAgain = false; scheduleRebuild(); }
    }
  }, 180);
}

watch(decksRoot, { recursive: true }, (_event, filename) => {
  if (!filename || String(filename).endsWith('.md')) scheduleRebuild();
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

  const file = resolve(root, `.${pathname}`);
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
    res.end(readFileSync(file, 'utf8').replace('</body>', `${reloadScript}</body>`));
    return;
  }
  createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`ローカルプレビュー: http://127.0.0.1:${port}/decks/`);
  console.log('終了するには Ctrl+C を押してください。');
});

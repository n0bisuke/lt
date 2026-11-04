#!/usr/bin/env node
// usage: node scripts/import-pdf.mjs <pdf> <YYYYMMDD_name> --title "発表タイトル" [--event "#IoTLT"]
// 発表済みの PDF を、1ページ1画像のデッキとして取り込む（macOS 専用）。公開はしない。
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : ''; };
const [pdf, name] = args;
const title = flag('--title');
const event = flag('--event') || '#IoTLT';
if (!pdf || !existsSync(pdf) || !/^\d{8}_[a-z0-9-]+$/.test(name ?? '') || !title) {
  console.error('usage: node scripts/import-pdf.mjs <pdf> <YYYYMMDD_英小文字の名前> --title "発表タイトル" [--event "#IoTLT"]');
  process.exit(1);
}
const deck = join(ROOT, 'decks', name);
if (existsSync(join(deck, 'index.html'))) {
  console.error(`decks/${name} はすでにあります`);
  process.exit(1);
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const images = join(deck, 'images');
mkdirSync(images, { recursive: true });
execFileSync('swift', [join(ROOT, 'scripts/render-pdf.swift'), pdf, images, '1920'], { stdio: 'inherit' });
const textPath = join(images, 'text.json');
const texts = JSON.parse(readFileSync(textPath, 'utf8'));
rmSync(textPath);

copyFileSync(pdf, join(deck, `${name}.pdf`));
copyFileSync(join(images, 'p01.png'), join(deck, 'thumbnail.png'));
execFileSync('sips', ['-Z', '1280', join(deck, 'thumbnail.png')], { stdio: 'ignore' });

const slides = texts.map((t, i) => {
  const alt = t.replace(/￼/g, '').replace(/\s+/g, ' ').trim();
  return `<section class="lt-slide"><img class="lt-full" src="images/p${String(i + 1).padStart(2, '0')}.png" alt="${esc(alt)}"></section>`;
}).join('\n');

writeFileSync(join(deck, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="../../design-system/tokens.css">
<link rel="stylesheet" href="../../design-system/project/components/bundle.css">
<script src="../../design-system/project/components/bundle.js"></script>
</head>
<body>
<main class="lt-deck">
${slides}
</main>
<script>IoTLT.Deck.mount();</script>
</body>
</html>
`);
writeFileSync(join(deck, 'deck.json'), JSON.stringify({ title, date: `${name.slice(0, 4)}-${name.slice(4, 6)}-${name.slice(6, 8)}`, event, eventUrl: flag('--event-url'), source: 'pdf', published: false }, null, 2) + '\n');
// PDF のほうが新しい状態にして、公開チェックの「PDF が古い」を避ける
execFileSync('touch', [join(deck, `${name}.pdf`)]);
console.log(`decks/${name}（${texts.length} 枚）`);

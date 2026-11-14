#!/usr/bin/env node
// usage: node scripts/build-deck.mjs decks/<deck>
// deck.md から deck.html を作る（ブラウザでの確認と PDF 書き出し用。コミットしない）
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeck, renderSlides } from './lib/deck.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(process.argv[2] ?? '');
const md = readFileSync(join(dir, 'deck.md'), 'utf8');
const meta = parseDeck(md).meta;
if (meta.variants === true) {
  console.error('これは複数版の編集元です。npm run variants -- decks/<デッキ名> で生成してください。');
  process.exit(1);
}
const depth = relative(ROOT, dir).split(sep).length;
const assetPrefix = `${Array(depth).fill('..').join('/')}/design-system`;
const { html, count } = renderSlides(md, { title: meta.title ?? '', assetPrefix });
writeFileSync(join(dir, 'deck.html'), html);
console.log(`${join(dir, 'deck.html')}（${count} 枚）`);

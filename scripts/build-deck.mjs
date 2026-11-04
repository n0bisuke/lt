#!/usr/bin/env node
// usage: node scripts/build-deck.mjs decks/<deck>
// deck.md から deck.html を作る（ブラウザでの確認と PDF 書き出し用。コミットしない）
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseDeck, renderSlides } from './lib/deck.mjs';

const dir = resolve(process.argv[2] ?? '');
const md = readFileSync(join(dir, 'deck.md'), 'utf8');
const { html, count } = renderSlides(md, { title: parseDeck(md).meta.title ?? '' });
writeFileSync(join(dir, 'deck.html'), html);
console.log(`${join(dir, 'deck.html')}（${count} 枚）`);

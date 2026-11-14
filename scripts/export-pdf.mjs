#!/usr/bin/env node
// Node.js だけで Marp デッキを PDF とサムネイルに書き出す。ブラウザは使わない。
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { renderPdf } from 'fullbleed';
import { parseDeck, renderSlides } from './lib/deck.mjs';
import { buildVariants, findVariantMasters } from './lecture/build-variants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DECKS = join(ROOT, 'decks');
const arg = process.argv[2];

function run(file, args) {
  const result = spawnSync(process.execPath, [join(ROOT, file), ...args], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function collectDeckDirs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const found = entries.some((entry) => entry.isFile() && entry.name === 'deck.md') ? [dir] : [];
  for (const entry of entries) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    found.push(...collectDeckDirs(join(dir, entry.name)));
  }
  return found;
}

function localAssetName(source) {
  if (/^(?:[a-z]+:|\/\/|data:|#)/i.test(source)) return null;
  const normalized = decodeURI(source).replace(/^\.\/+/, '').replace(/^(?:\.\.\/)+/, '');
  return normalized.startsWith('images/') || normalized.startsWith('design-system/') ? normalized : null;
}

function findAssets(html, css) {
  const refs = new Set();
  const combined = `${html}\n${css}`;
  for (const match of combined.matchAll(/(?:src|poster|href)\s*=\s*["']([^"']+)["']/g)) {
    const name = localAssetName(match[1]);
    if (name) refs.add(name);
  }
  for (const match of combined.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const name = localAssetName(match[1]);
    if (name) refs.add(name);
  }
  return refs;
}

function rewriteAssets(text) {
  return text
    .replace(/(?:\.\.\/)+design-system\//g, 'assets/design-system/')
    .replace(/(["'(=])images\//g, '$1assets/images/')
    .replace(/(?:assets\/)?design-system\/lecture\/fonts\/NotoSansJP\.ttf/g, 'NotoSansJP.ttf')
    .replace(/(?:assets\/)?design-system\/lecture\/fonts\/NotoSansMono\.ttf/g, 'NotoSansMono.ttf');
}

async function exportDeck(dir) {
  const sourcePath = join(dir, 'deck.md');
  const source = readFileSync(sourcePath, 'utf8');
  const { meta } = parseDeck(source);
  if (meta.variants === true) throw new Error(`${sourcePath}: 15min/、10min/、5min/ の生成版を指定してください`);
  if (existsSync(join(dir, 'deck.json')) && JSON.parse(readFileSync(join(dir, 'deck.json'), 'utf8')).source === 'pdf') {
    console.log(`${relative(ROOT, dir)}: 取り込み済みPDFを保持します`);
    return;
  }

  const rendered = renderSlides(source, { title: meta.title ?? '' });
  const style = /<style>([\s\S]*?)<\/style>/.exec(rendered.html)?.[1];
  const sections = [...rendered.html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map((match) => match[0]);
  if (!style || sections.length !== rendered.count) {
    throw new Error(`${sourcePath}: ${rendered.count}枚のスライドHTMLを取り出せませんでした`);
  }

  const bundleCss = readFileSync(join(ROOT, 'design-system/project/components/bundle.css'), 'utf8')
    .replace(/^@import[^\n]*\n/m, '');
  let css = rewriteAssets(`${style}\n${bundleCss}`)
    .replace(/@import\s+[^;]+;/g, '')
    .replace(/:root\s*\{[^}]*--font-sans:[^;]+;[^}]*\}/g, (root) => root)
    .concat('\n:root{--font-sans:"Noto Sans JP",sans-serif;--font-mono:"Noto Sans Mono","Noto Sans JP",monospace;}');
  css += '\n@page{size:1280px 720px;margin:0}html,body{margin:0;padding:0}body{font-family:"Noto Sans JP",sans-serif}main{margin:0;padding:0}section{width:1280px;height:720px;box-sizing:border-box;break-after:page;page-break-after:always}section:last-child{break-after:auto;page-break-after:auto}';

  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main>${rewriteAssets(sections.join('\n'))}</main></body></html>`;
  const assets = {};
  for (const asset of findAssets(html, css)) {
    const from = asset.startsWith('images/') ? join(dir, asset) : join(ROOT, asset);
    if (!existsSync(from)) throw new Error(`${sourcePath}: ${asset} が見つかりません`);
    assets[asset] = readFileSync(from);
  }
  const fontDir = join(ROOT, 'design-system/lecture/fonts');
  const fonts = [
    { name: 'NotoSansJP.ttf', data: readFileSync(join(fontDir, 'NotoSansJP.ttf')) },
    { name: 'NotoSansMono.ttf', data: readFileSync(join(fontDir, 'NotoSansMono.ttf')) },
  ];
  const result = await renderPdf({
    html,
    css,
    assets,
    fonts,
    defaultStyles: false,
    maxPages: 200,
    previewDpi: 96,
  });
  if (result.pages !== rendered.count || !result.previews?.[0]) {
    throw new Error(`${sourcePath}: PDFは${result.pages}ページ、スライドは${rendered.count}枚です`);
  }

  const id = meta.id ?? dir.split(sep).at(-1);
  writeFileSync(join(dir, `${id}.pdf`), result.pdf);
  writeFileSync(join(dir, 'thumbnail.png'), result.previews[0]);
  console.log(`${relative(ROOT, dir)}: ${result.pages}ページを出力しました（Node.js / Fullbleed）`);
}

run('scripts/build-tokens.mjs', []);
for (const master of findVariantMasters()) buildVariants(master);

let dirs;
if (arg) {
  dirs = [resolve(ROOT, arg)];
} else {
  dirs = collectDeckDirs(DECKS).filter((dir) => {
    const source = readFileSync(join(dir, 'deck.md'), 'utf8');
    const { meta } = parseDeck(source);
    return meta.published === true && meta.variants !== true;
  });
}

for (const dir of dirs) {
  if (!existsSync(join(dir, 'deck.md'))) throw new Error(`${dir}/deck.md がありません`);
  await exportDeck(dir);
}

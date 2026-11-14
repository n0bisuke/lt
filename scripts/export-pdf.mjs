#!/usr/bin/env node
// Node.js で Marp HTML を組み立て、WeasyPrint と Poppler で PDF/サムネイルを作る。
// ブラウザーやブラウザー自動化は使わない。
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDeck, renderSlides } from './lib/deck.mjs';
import { buildVariants, findVariantMasters } from './lecture/build-variants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DECKS = join(ROOT, 'decks');
const args = process.argv.slice(2);
const changedOnly = args.includes('--changed');
const arg = args.find((value) => !value.startsWith('--'));
const weasyprint = process.env.WEASYPRINT_BIN || 'weasyprint';
const pdftoppm = process.env.PDFTOPPM_BIN || 'pdftoppm';

function run(file, args, options = {}) {
  const result = spawnSync(file, args, { cwd: ROOT, encoding: 'utf8', ...options });
  if (result.error) throw new Error(`${file} を起動できません。WeasyPrint と Poppler をインストールしてください。`);
  if (result.status !== 0) throw new Error(`${file} に失敗しました:\n${result.stderr || result.stdout}`);
  return result;
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

function marpPages(html) {
  const pages = [];
  const startTag = /<svg\b[^>]*\bdata-marpit-svg(?:="")?[^>]*>/g;
  let match;
  while ((match = startTag.exec(html))) {
    let depth = 1;
    const tags = /<\/?svg\b[^>]*>/g;
    tags.lastIndex = startTag.lastIndex;
    let end;
    while ((end = tags.exec(html))) {
      if (/^<svg\b/.test(end[0])) depth++;
      else if (--depth === 0) {
        pages.push(html.slice(match.index, tags.lastIndex));
        startTag.lastIndex = tags.lastIndex;
        break;
      }
    }
  }
  return pages;
}

function pageContent(svg) {
  return [...svg.matchAll(/<foreignObject\b[^>]*>([\s\S]*?)<\/foreignObject>/g)]
    .map((match) => match[1]).join('\n');
}

function fileUrl(path) {
  return `file://${path.split(sep).map(encodeURIComponent).join('/')}`;
}

function rewriteAssets(text, dir) {
  const designUrl = `${fileUrl(ROOT)}/design-system/`;
  const imageUrl = `${fileUrl(dir)}/images/`;
  return text
    .replace(/((?:src|poster|href)=["'])(?:\.\.\/)*design-system\//g, `$1${designUrl}`)
    .replace(/((?:src|poster|href)=["'])images\//g, `$1${imageUrl}`)
    .replace(/url\((['"]?)(?:\.\.\/)*design-system\//g, `url($1${designUrl}`)
    .replace(/url\((['"]?)images\//g, `url($1${imageUrl}`);
}

function adjustedCss(html, tokenCss, bundleCss) {
  return `${tokenCss}\n${html}\n${bundleCss}`
    .replace(/^@import[^\n]*\n/gm, '')
    .replaceAll('div.marpit > svg > foreignObject > section', '.lt-pdf-slide > section')
    .replaceAll('div.marpit > svg > foreignObject > :where(section)', '.lt-pdf-slide > :where(section)')
    .replaceAll('div.marpit > svg > foreignObject', '.lt-pdf-slide')
    .replaceAll('div.marpit > svg[data-marpit-svg]', '.lt-pdf-slide')
    .replace(/page-break-before:\s*always;\s*break-before:\s*page/g, '')
    .concat('\n@page{size:1280px 720px;margin:0}html,body{margin:0;padding:0;width:1280px}main{margin:0;padding:0;width:1280px}.lt-pdf-slide{position:relative;width:1280px;height:720px;overflow:hidden;break-after:page;page-break-after:always}.lt-pdf-slide:last-child{break-after:auto;page-break-after:auto}.lt-pdf-slide>section{position:absolute!important;inset:0!important;width:1280px!important;height:720px!important;max-width:none!important;overflow:hidden!important;break-before:avoid!important;break-after:avoid!important;page-break-before:avoid!important;page-break-after:avoid!important}.gl-author p,.lt-author p{white-space:nowrap!important}');
}

function cssForAdjustments(adjustments) {
  const rules = [];
  for (const [key, value] of Object.entries(adjustments ?? {})) {
    const match = /^(\d+):(\d+):((?:\d+\.)*\d+)$/.exec(key);
    if (!match || !value || !Number.isInteger(value.x) || !Number.isInteger(value.y)) continue;
    const [slide, section, ...path] = [Number(match[1]), Number(match[2]), ...match[3].split('.').map(Number)];
    let selector = `.lt-pdf-slide:nth-child(${slide + 1}) > section:nth-of-type(${section + 1})`;
    for (const child of path) selector += ` > :nth-child(${child + 1})`;
    const declarations = [`translate:${value.x}px ${value.y}px!important`];
    if (Number.isInteger(value.width)) declarations.push(`width:${value.width}px!important`);
    if (Number.isInteger(value.height)) declarations.push(`height:${value.height}px!important`);
    rules.push(`${selector}{${declarations.join(';')}}`);
  }
  return rules.join('\n');
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
  const pages = marpPages(rendered.html);
  if (!style || pages.length !== rendered.count) throw new Error(`${sourcePath}: ${rendered.count}枚のスライドを読み取れませんでした`);

  const adjustmentPath = join(dir, '.lt-adjustments.json');
  const adjustments = existsSync(adjustmentPath) ? JSON.parse(readFileSync(adjustmentPath, 'utf8')) : {};
  const tokenCss = readFileSync(join(ROOT, 'design-system/tokens.css'), 'utf8');
  const bundleCss = readFileSync(join(ROOT, 'design-system/project/components/bundle.css'), 'utf8');
  const css = rewriteAssets(adjustedCss(style, tokenCss, bundleCss), dir) + `\n${cssForAdjustments(adjustments)}`;
  const content = pages.map((page) => `<div class="lt-pdf-slide">${rewriteAssets(pageContent(page), dir)}</div>`).join('\n');
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body><main>${content}</main></body></html>`;
  const scratch = mkdtempSync(join(tmpdir(), 'lt-pdf-'));
  try {
    const htmlPath = join(scratch, 'deck.html');
    const outputPath = join(dir, `${meta.id ?? dir.split(sep).at(-1)}.pdf`);
    writeFileSync(htmlPath, html);
    run(weasyprint, [htmlPath, outputPath]);
    const info = run('pdfinfo', [outputPath]).stdout;
    const pdfPages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
    if (pdfPages !== rendered.count) throw new Error(`${sourcePath}: PDFは${pdfPages}ページ、スライドは${rendered.count}枚です`);
    const thumbnailBase = join(scratch, 'thumbnail');
    run(pdftoppm, ['-f', '1', '-singlefile', '-png', '-r', '96', outputPath, thumbnailBase]);
    writeFileSync(join(dir, 'thumbnail.png'), readFileSync(`${thumbnailBase}.png`));
    console.log(`${relative(ROOT, dir)}: ${pdfPages}ページを出力しました（Node.js / WeasyPrint、ブラウザーなし）`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

run(process.execPath, [join(ROOT, 'scripts/build-tokens.mjs')]);
for (const master of findVariantMasters()) buildVariants(master);

let dirs;
if (arg) dirs = [resolve(ROOT, arg)];
else dirs = collectDeckDirs(DECKS).filter((dir) => {
  const { meta } = parseDeck(readFileSync(join(dir, 'deck.md'), 'utf8'));
  return meta.published === true && meta.variants !== true;
});

if (changedOnly && !arg) {
  let base = process.env.PDF_BASE_SHA;
  if (!base) {
    const previous = spawnSync('git', ['rev-parse', 'HEAD^'], { cwd: ROOT, encoding: 'utf8' });
    base = previous.status === 0 ? previous.stdout.trim() : '';
  }
  const diff = base
    ? spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
    : { status: 1, stdout: '' };
  if (diff.status !== 0) {
    console.log('PDFの差分元を特定できないため、公開デッキをすべて書き出します。');
  } else {
    const changed = diff.stdout.split('\n').filter(Boolean);
    const sharedChange = changed.some((path) => path.startsWith('design-system/')
      || ['scripts/export-pdf.mjs', 'scripts/lib/deck.mjs', 'package.json', 'package-lock.json'].includes(path));
    dirs = sharedChange ? dirs : dirs.filter((dir) => {
      const rel = relative(ROOT, dir).split(sep).join('/');
      const ancestors = [rel];
      let parent = rel;
      while (parent.includes('/')) { parent = parent.slice(0, parent.lastIndexOf('/')); ancestors.push(parent); }
      return changed.some((path) => ancestors.some((ancestor) => path === `${ancestor}/deck.md`)
        || path.startsWith(`${rel}/`));
    });
    console.log(`変更に合わせてPDFを書き出します（${dirs.length}本）。`);
  }
}

for (const dir of dirs) {
  if (!existsSync(join(dir, 'deck.md'))) throw new Error(`${dir}/deck.md がありません`);
  await exportDeck(dir);
}

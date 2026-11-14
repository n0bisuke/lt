#!/usr/bin/env node
// usage: node scripts/lecture/build-variants.mjs [decks/<master>]
// variants: true の deck.md を元に、variant subfolders の deck.md を生成する。
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeck } from '../lib/deck.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DECKS = join(ROOT, 'decks');
const VARIANTS = [
  { name: '15min', idSuffix: '', titleSuffix: '' },
  { name: '10min', idSuffix: '-10min', titleSuffix: '（10分版）' },
  { name: '5min', idSuffix: '-5min', titleSuffix: '（5分版）' },
];

function splitSlides(body) {
  const slides = [];
  let current = [];
  let fence = null;
  for (const line of body.split('\n')) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line);
    if (match) {
      if (!fence) fence = match[1][0];
      else if (match[1][0] === fence) fence = null;
    }
    if (!fence && /^---\s*$/.test(line)) {
      slides.push(current.join('\n').trim());
      current = [];
    } else current.push(line);
  }
  if (current.join('\n').trim()) slides.push(current.join('\n').trim());
  return slides;
}

function replaceFrontmatter(markdown, meta) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
  if (!match) throw new Error('variants master に YAML frontmatter がありません');
  const lines = match[1].split('\n').filter((line) => !/^(?:id|title|variants|path):\s*/.test(line));
  const title = JSON.stringify(`${meta.title ?? ''}${meta.titleSuffix}`);
  lines.push(`id: ${meta.id}`);
  lines.push(`title: ${title}`);
  lines.push(`path: ${meta.path}`);
  return `---\n${lines.join('\n')}\n---`;
}

function selectedSlide(slide, variant) {
  const match = /<!--\s*only:\s*([\w,\s-]+)\s*-->/.exec(slide);
  if (match && !match[1].split(',').map((x) => x.trim()).includes(variant)) return null;
  return slide.replace(/<!--\s*only:\s*[\w,\s-]+\s*-->/g, '').trim();
}

function referencedImages(markdown) {
  return new Set([...markdown.matchAll(/images\/[^\s"'()<>&|]+/g)].map((m) => m[0]));
}

export function buildVariants(sourceDir) {
  const sourcePath = join(sourceDir, 'deck.md');
  const source = readFileSync(sourcePath, 'utf8');
  const { meta, body } = parseDeck(source);
  if (meta.variants !== true) throw new Error(`${sourcePath}: variants: true がありません`);
  const slides = splitSlides(body);
  const outputDirs = [];

  for (const variant of VARIANTS) {
    const selected = slides.map((slide) => selectedSlide(slide, variant.name)).filter(Boolean);
    const baseRoute = meta.path ?? meta.id ?? relative(DECKS, sourceDir).split(sep).at(-1);
    const frontmatter = replaceFrontmatter(source, {
      ...meta,
      id: `${meta.id ?? relative(DECKS, sourceDir).split(sep).at(-1)}${variant.idSuffix}`,
      path: variant.name === '15min' ? baseRoute : `${baseRoute}/${variant.name}`,
      titleSuffix: variant.titleSuffix,
    });
    const output = `${frontmatter}\n\n${selected.join('\n\n---\n\n')}\n`
      .replaceAll('../../design-system/', '../../../design-system/');
    const outputDir = join(sourceDir, variant.name);
    const outputPath = join(outputDir, 'deck.md');
    mkdirSync(outputDir, { recursive: true });
    if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) writeFileSync(outputPath, output);

    const imageDir = join(outputDir, 'images');
    rmSync(imageDir, { recursive: true, force: true });
    for (const image of referencedImages(output)) {
      const from = resolve(sourceDir, image);
      const to = resolve(outputDir, image);
      if (!from.startsWith(`${resolve(sourceDir, 'images')}${sep}`)) throw new Error(`画像パスが不正です: ${image}`);
      if (!existsSync(from)) throw new Error(`${sourcePath}: ${image} が見つかりません`);
      mkdirSync(dirname(to), { recursive: true });
      cpSync(from, to);
    }
    outputDirs.push(outputDir);
  }
  return outputDirs;
}

export function findVariantMasters() {
  return readdirSync(DECKS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(DECKS, entry.name))
    .filter((dir) => existsSync(join(dir, 'deck.md')) && parseDeck(readFileSync(join(dir, 'deck.md'), 'utf8')).meta.variants === true);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dirs = process.argv[2] ? [resolve(ROOT, process.argv[2])] : findVariantMasters();
  for (const dir of dirs) {
    const outputs = buildVariants(dir);
    console.log(`${relative(ROOT, dir)}: ${outputs.map((x) => relative(dir, x)).join(', ')} を生成しました`);
  }
}

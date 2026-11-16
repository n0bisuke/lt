#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockedSlideIndices, parseDeck } from './lib/deck.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DECKS = join(ROOT, 'decks');
const output = process.env.GITHUB_OUTPUT;
if (!output) throw new Error('GITHUB_OUTPUT is required');

function collect(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const markdown = join(dir, 'deck.md');
  const found = [];
  if (entries.some((entry) => entry.isFile() && entry.name === 'deck.md')) {
    const source = readFileSync(markdown, 'utf8');
    const meta = parseDeck(source).meta;
    const parentSource = join(dir, '..', 'deck.md');
    const parentMeta = existsSync(parentSource) ? parseDeck(readFileSync(parentSource, 'utf8')).meta : {};
    const configured = !parentMeta.variants || (basename(dir) !== '15min'
      && String(parentMeta.variantNames ?? '10min').split(',').map((name) => name.trim()).includes(basename(dir)));
    if (configured && meta.published === true && meta.unlisted !== true && lockedSlideIndices(source).length === 0) {
      found.push({ dir, id: meta.id ?? basename(dir) });
    }
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    found.push(...collect(join(dir, entry.name)));
  }
  return found;
}

const paths = collect(DECKS).flatMap(({ dir, id }) => [
  join(dir, `${id}.pdf`),
  join(dir, 'thumbnail.png'),
].filter(existsSync).map((path) => path.slice(ROOT.length + 1)));
appendFileSync(output, `paths<<PDF_PATHS\n${paths.join('\n')}\nPDF_PATHS\n`);

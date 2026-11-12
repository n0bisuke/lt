// theme: lecture の deck.md を探す。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const isLecture = (text) => /^theme:\s*lecture\s*$/m.test((/^---\n([\s\S]*?)\n---/.exec(text) ?? ['', ''])[1]);
export function lectureDecks() {
  const dir = join(root, 'decks');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name, 'deck.md'))
    .filter((f) => existsSync(f) && isLecture(readFileSync(f, 'utf8')));
}

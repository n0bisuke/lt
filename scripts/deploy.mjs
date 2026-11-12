#!/usr/bin/env node
// usage: npm run deploy [-- "コミットメッセージ"]
//        npm run deploy -- --dry-run   （何がコミットされるかだけを表示）
// サイトを確認してから git add / commit / push する。
// 公開リポジトリなので、decks/ は published: true のデッキだけを add する。
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeck } from './lib/deck.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 16);
const message = args.find((a) => !a.startsWith('--')) || `Update slides ${stamp}`;

const run = (cmd, ...a) => execFileSync(cmd, a, { cwd: ROOT, stdio: 'inherit' });

function isPublished(dir) {
  const md = join(dir, 'deck.md');
  if (existsSync(md)) return parseDeck(readFileSync(md, 'utf8')).meta.published === true;
  const json = join(dir, 'deck.json');
  return existsSync(json) && JSON.parse(readFileSync(json, 'utf8')).published === true;
}

// Speaker Deck の一覧を更新する。取得できなくても、前回の内容のまま続ける
try {
  run('node', 'scripts/fetch-external.mjs', '--speakerdeck-only');
} catch {
  console.error('注意: 外部スライドの一覧を更新できなかったので、前回の内容を使います。');
}

// 未完成のデッキ（lt-slot や【要確認】が残っているなど）があればここで止まる
try {
  run('node', 'scripts/build-tokens.mjs');
  run('node', 'scripts/build-site.mjs', ...(dryRun ? [] : ['--move-unused']));
} catch {
  console.error('サイトを組み立てられなかったので、コミットしていません。');
  process.exit(1);
}

const decks = readdirSync(join(ROOT, 'decks'), { withFileTypes: true }).filter((e) => e.isDirectory());
const published = decks.filter((e) => isPublished(join(ROOT, 'decks', e.name))).map((e) => e.name);
const drafts = decks.map((e) => e.name).filter((n) => !published.includes(n));
const paths = [['.', ':(exclude)decks'], ...published.map((n) => [`decks/${n}`])];

if (dryRun) {
  for (const p of paths) run('git', 'add', '-A', '-n', '--', ...p);
  console.log(`未公開のためコミットしないデッキ: ${drafts.join(', ') || 'なし'}`);
  process.exit(0);
}

for (const p of paths) run('git', 'add', '-A', '--', ...p);
if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: ROOT }).status === 0) {
  console.log('コミットする変更はありません。');
} else {
  run('git', 'commit', '-m', message);
}
run('git', 'push', 'origin', 'HEAD');
console.log(`未公開のためコミットしていないデッキ: ${drafts.join(', ') || 'なし'}`);

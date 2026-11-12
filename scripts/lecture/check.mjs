// スライドがデザインシステムのルールを守っているかを検査する。
// 講演テーマ（theme: lecture）の deck.md を検査する。
// 使い方: npm run check [-- ファイル...]。違反があれば終了コード1で終わる。
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTheme, THEME_PATH } from './build-theme.mjs';
import { lectureDecks, root } from './decks.mjs';

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const CLASSES = new Set(['title-slide', 'speaker-profile', 'brand', 'hero', 'key-message', 'agenda', 'overview', 'era-slide', 'recap', 'era-map', 'source-cards', 'tool-gallery', 'poll-result', 'actor-flow', 'zone-compare', 'phase-chart', 'prompt-block', 'closing', 'link-cards', 'stage', 'panel']);
const STATE = new Set(['is-dim', 'is-top', 'is-focus']);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const theme = readFileSync(THEME_PATH, 'utf8');
if (theme !== buildTheme()) fail('design-system/marp/lecture.css', 'tokens.json または theme.src.css と一致しません。node scripts/build-tokens.mjs を実行してください');

const src = readFileSync(join(root, 'design-system/lecture/theme.src.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g)) fail('design-system/lecture/theme.src.css', `色の直書き ${m[0]}。tokens.json に追加してください`);

const defined = new Set([...theme.matchAll(/\.((?:gl|t)-[\w-]+)/g)].map((m) => m[1]));

const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => resolve(a))
  : lectureDecks();

for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const front = text.match(/^---\n([\s\S]*?)\n---/);
  if (!front || !/^marp:\s*true$/m.test(front[1])) fail(rel, '先頭に marp: true がありません');
  if (!front || !/^theme:\s*lecture$/m.test(front[1])) fail(rel, '先頭に theme: lecture がありません');

  let fenced = false;
  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (fenced) return;
    if (/^<!--\s*card:/.test(line) && !/^<article class="gl-linkcard/.test(lines[i + 1] ?? '')) fail(at, 'カードが未展開です。npm run cards を実行してください');
    if (/^<article class="gl-linkcard/.test(line)) {
      // 外部サイトの文字を含む生成行なので、画像の存在だけを確認する
      const img = line.match(/<img src="([^"]+)"/)?.[1];
      if (img && !existsSync(resolve(dirname(file), img))) fail(at, `画像が見つかりません ${img}`);
      return;
    }
    for (const m of line.matchAll(/<!--\s*_?class:\s*([^>]*?)\s*-->/g)) {
      for (const c of m[1].split(/\s+/)) if (!CLASSES.has(c)) fail(at, `未定義の部品 ${c}`);
    }
    if (/<style|_?backgroundColor:|_?color:\s/.test(line)) fail(at, '見た目をスライドで指定しています。部品だけを使ってください');
    for (const m of line.matchAll(/style="([^"]*)"/g)) {
      if (!/^width:\d+(\.\d+)?%$/.test(m[1])) fail(at, `style="${m[1]}" は使えません（バーの width:NN% のみ可）`);
    }
    if (/#[0-9a-fA-F]{3,8}\b/.test(line.replace(/\]\([^)]*\)|https?:\S+/g, '')) && /<|style|color/.test(line)) fail(at, '色を直接書いています');
    if (/\*\*[^*\n]*[。、！？）」』…]\*\*[^\s*。、！？）」』]/.test(line)) fail(at, '約物の直後で ** を閉じると太字になりません。<b>…</b> を使ってください');
    if (/^\s*[-*]\s+\d+\.\s/.test(line)) fail(at, '「- 1. 」は番号付きリストになります。「- 1\\. 」と書いてください');
    for (const m of line.matchAll(/\bclass="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) if (/^(gl|t)-/.test(c) ? !defined.has(c) : !STATE.has(c)) fail(at, `未定義のクラス ${c}`);
    }
    const refs = [...line.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g), ...line.matchAll(/\bsrc="([^"]+)"/g)].map((m) => m[1]);
    for (const r of refs) {
      if (/^https?:|^data:/.test(r)) continue;
      if (!existsSync(resolve(dirname(file), r))) fail(at, `画像が見つかりません ${r}`);
    }
  });

  const body = front ? text.slice(front[0].length) : text;
  body.split(/\n---\n/).forEach((slide, i) => {
    if (/^(<!--[\s\S]*?-->|\s|!\[[^\]]*\]\([^)]*\))*$/.test(slide)) return;
    if (!/^# /m.test(slide)) fail(`${rel} スライド${i + 1}`, '見出し（# ）がありません');
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} 件の違反があります`);
  process.exit(1);
}
console.log(`OK: ${files.length} ファイルを検査しました`);

#!/usr/bin/env node
// design-system/project/tokens.json から、デッキが読み込む design-system/tokens.css を生成する。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'design-system');
const t = JSON.parse(readFileSync(join(root, 'project/tokens.json'), 'utf8'));
const out = [`/* ${t.name} — generated from tokens.json */`];

const vars = [];
for (const c of t.color.tokens) vars.push(`--${c.name}: ${c.value};`);
for (const s of t.shadow?.tokens ?? []) vars.push(`--${s.name}: ${s.value};`);
for (const fam of ['spacing', 'radius', 'stroke']) for (const s of t[fam].tokens) vars.push(`--${s.name}: ${s.value};`);
for (const [k, v] of Object.entries(t.type.families)) vars.push(`--font-${k}: ${v};`);
out.push(`:root {\n  ${vars.join('\n  ')}\n}`);

for (const g of t.type.groups) {
  for (const s of g.styles) {
    out.push(`.${s.name} {\n  font-family: var(--font-${s.family ?? g.family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n  letter-spacing: ${s.letterSpacing ?? 0};\n}`);
  }
}
writeFileSync(join(root, 'tokens.css'), out.join('\n') + '\n');
console.log('wrote design-system/tokens.css');

// Marp のテーマ: tokens + 文字サイズの変数 + 部品の CSS + Markdown 用の CSS
const typeVars = t.type.groups.flatMap((g) => g.styles.flatMap((s) => [
  `--t-${s.name}-size: ${s.fontSize};`,
  `--t-${s.name}-weight: ${s.fontWeight};`,
  `--t-${s.name}-line: ${s.lineHeight};`,
  `--t-${s.name}-spacing: ${s.letterSpacing ?? 0};`,
]));
const bundle = readFileSync(join(root, 'project/components/bundle.css'), 'utf8');
const fontImport = (/^@import[^\n]*\n/m.exec(bundle) ?? [''])[0];
const components = bundle.replace(fontImport, '').split('/* ---------- Deck runtime')[0];
const theme = [
  '/* @theme iotlt */',
  '/* @size 16:9 1920px 1080px */',
  '/* tokens.json、bundle.css、marp/theme.src.css から生成。手で編集しない（node scripts/build-tokens.mjs） */',
  fontImport.trim(),
  `:root {\n  ${[...vars, ...typeVars].join('\n  ')}\n}`,
  ...out.slice(2),
  components.trim(),
  readFileSync(join(root, 'marp/theme.src.css'), 'utf8').trim(),
].join('\n');
writeFileSync(join(root, 'marp/iotlt.css'), theme + '\n');
console.log('wrote design-system/marp/iotlt.css');

// 講演テーマ（theme: lecture）
const { buildTheme: buildLecture, THEME_PATH: LECTURE_PATH } = await import('./lecture/build-theme.mjs');
writeFileSync(LECTURE_PATH, buildLecture());
console.log('wrote design-system/marp/lecture.css');

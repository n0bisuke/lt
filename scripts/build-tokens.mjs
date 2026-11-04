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

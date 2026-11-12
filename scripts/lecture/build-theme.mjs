// 講演テーマ: design-system/lecture の tokens.json と theme.src.css から design-system/marp/lecture.css を生成する。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ds = (p) => fileURLToPath(new URL(`../../design-system/${p}`, import.meta.url));

const svg = {
  HUMAN: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="14" r="10"/><path d="M6 44c0-11 8-18 18-18s18 7 18 18z"/></svg>',
  ROBOT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 4v7"/><rect x="9" y="11" width="30" height="24" rx="5"/><circle cx="18" cy="21" r="3.5"/><circle cx="30" cy="21" r="3.5"/><path d="M18 29h12M3 19v8M45 19v8M16 35v6M32 35v6"/></svg>',
};
const mask = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

export const THEME_PATH = ds('marp/lecture.css');

export function buildTheme() {
  const t = JSON.parse(readFileSync(ds('lecture/tokens.json'), 'utf8'));
  const [light, stage] = t.color.themes.map((x) => x.id);
  const vars = (id) => t.color.tokens.map((c) => `--${c.name}:${c.value[id]};`).join('');
  const dims = ['spacing', 'radius', 'stroke'].flatMap((f) => t[f].tokens).map((k) => `--${k.name}:${k.value};`).join('');
  const fams = Object.entries(t.type.families).map(([k, v]) => `--font-${k}:${v};`).join('');
  let src = readFileSync(ds('lecture/theme.src.css'), 'utf8');
  for (const [k, v] of Object.entries(svg)) src = src.replaceAll(`%${k}%`, mask(v));
  // フォントの URL はデッキ（decks/<名前>/）から見た位置
  return `/* @theme lecture */
/* 生成ファイル。design-system/lecture の tokens.json か theme.src.css を直して node scripts/build-tokens.mjs を実行する。 */
@font-face{font-family:"Noto Sans JP";src:url("../../design-system/lecture/fonts/NotoSansJP.ttf") format("truetype");font-weight:100 900}
@font-face{font-family:"Noto Sans Mono";src:url("../../design-system/lecture/fonts/NotoSansMono.ttf") format("truetype");font-weight:100 900}
section{${vars(light)}${dims}${fams}}
section.${stage}{${vars(stage)}}
${src}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(THEME_PATH, buildTheme());
  console.log('wrote design-system/marp/lecture.css');
}

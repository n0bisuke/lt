#!/usr/bin/env node
// 教材mdの指定した1行にあるGyazo URLを、新しいURLに差し替えるスクリプト
//
// 使い方:
//   node replace-url.mjs <md> --line <行番号> --from <旧GyazoID> --to <新URL>           # 確認のみ（変更しない）
//   node replace-url.mjs <md> --line <行番号> --from <旧GyazoID> --to <新URL> --apply   # 書き換える
//
// 同じ画像がmd内に複数回出てくることがあるため、行番号で1か所だけを対象にする。
// 書き換えるのはその行のURL部分だけで、width などの属性はそのまま残す。

import fs from 'node:fs/promises';

import { GYAZO_RE } from './gyazo-common.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') args.apply = true;
    else if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[++i];
    else args._.push(argv[i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const md = args._[0];
  const lineNo = Number(args.line);
  if (!md || !lineNo || !args.from || !args.to) {
    console.error('使い方: node replace-url.mjs <md> --line <行番号> --from <旧GyazoID> --to <新URL> [--apply]');
    process.exit(1);
  }
  if (!/^https:\/\/i\.gyazo\.com\/[0-9a-f]{32}\.(png|jpe?g)$/.test(args.to)) {
    throw new Error(`--to は https://i.gyazo.com/<32桁のID>.png の形式で指定してください: ${args.to}`);
  }

  const text = await fs.readFile(md, 'utf8');
  const lines = text.split('\n');
  const before = lines[lineNo - 1];
  if (before == null) throw new Error(`${md} に ${lineNo} 行目はありません`);
  const hits = [...before.matchAll(GYAZO_RE)].filter((m) => m[1] === args.from);
  if (hits.length !== 1) throw new Error(`${lineNo} 行目に ${args.from} のURLが ${hits.length} 件あります（1件である必要があります）:\n${before}`);

  const after = before.replace(hits[0][0], args.to);
  console.log(`${md}:${lineNo}`);
  console.log(`- ${before}`);
  console.log(`+ ${after}`);
  if (!args.apply) {
    console.log('\n（確認のみ。書き換えるには --apply を付けて実行）');
    return;
  }
  lines[lineNo - 1] = after;
  await fs.writeFile(md, lines.join('\n'));
  console.log('\n書き換えました');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

#!/usr/bin/env node
// 教材mdに埋め込まれたGyazo画像を、出現順に一覧するスクリプト
//
// 使い方:
//   node list-images.mjs <md>
//
// 画像ごとに 行番号・GyazoID・URL・mdでの表示幅・作業用の元画像パス・画像サイズを出力する。
// 表示幅は Zenn の `=450x` か、<img> の width 属性から読む。指定がなければ「-」。
// 元画像はGyazoからダウンロードする（作業フォルダにあれば再利用する）。
//
// 作業フォルダ: <リポジトリ>/.annotate-work/<mdのパス（拡張子なし）>/
//   <GyazoID先頭8桁>.src.png  … 元画像（注釈JSONの input に使う）

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { ROOT, GYAZO_RE, toPosix, exists } from './gyazo-common.mjs';

const WORK_ROOT = path.join(ROOT, '.annotate-work');
const workDirFor = (mdPath) =>
  path.join(WORK_ROOT, toPosix(path.relative(ROOT, path.resolve(mdPath))).replace(/\.md$/, ''));

async function fetchSource(id, ext, dest) {
  if (await exists(dest)) return 'cache';
  const res = await fetch(`https://i.gyazo.com/${id}.${ext}`);
  if (!res.ok) throw new Error(`ダウンロード失敗 ${id}: HTTP ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return 'gyazo';
}

async function main() {
  const md = process.argv[2];
  if (!md) {
    console.error('使い方: node list-images.mjs <md>');
    process.exit(1);
  }
  const text = await fs.readFile(md, 'utf8');
  const workDir = workDirFor(md);
  await fs.mkdir(workDir, { recursive: true });

  const lines = text.split('\n');
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(GYAZO_RE)) {
      n++;
      const id = m[1];
      const ext = m[2] === 'jpeg' ? 'jpg' : m[2] ?? 'png';
      const width = lines[i].match(/=(\d+)x\)/)?.[1] ?? lines[i].match(/width="?(\d+)/)?.[1] ?? '-';
      if (ext === 'mp4' || ext === 'gif') {
        console.log(`${String(n).padStart(2)}. L${i + 1}  ${id}  （${ext} のため対象外）`);
        continue;
      }
      const src = path.join(workDir, `${id.slice(0, 8)}.src.${ext}`);
      const from = await fetchSource(id, ext, src);
      const meta = await sharp(src).metadata();
      console.log(`${String(n).padStart(2)}. L${i + 1}  ${id}  表示幅=${width}  ${meta.width}x${meta.height}  ` +
        `${toPosix(path.relative(ROOT, src))}（${from}）`);
      console.log(`    ${m[0]}`);
    }
  }
  console.log(`\n作業フォルダ: ${toPosix(path.relative(ROOT, workDir))}/`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

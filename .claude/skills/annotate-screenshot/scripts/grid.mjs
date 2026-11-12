#!/usr/bin/env node
// 座標を読み取りやすくするため、画像に方眼（ピクセル座標の目盛り）を重ねた確認用画像を作るスクリプト
//
// 使い方:
//   node grid.mjs <input> <output> [--step 100] [--crop x,y,w,h]
//
// --crop を付けると、その範囲だけを切り出して方眼を重ねる（目盛りは元画像の座標のまま）。
// 細かい位置合わせや、注釈後の画像の拡大チェックに使う。

import path from 'node:path';
import sharp from 'sharp';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[++i];
    else args._.push(argv[i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [input, output] = args._;
  if (!input || !output) {
    console.error('使い方: node grid.mjs <input> <output> [--step 100] [--crop x,y,w,h]');
    process.exit(1);
  }
  const meta = await sharp(input).metadata();
  let [cx, cy, cw, ch] = [0, 0, meta.width, meta.height];
  if (args.crop) [cx, cy, cw, ch] = args.crop.split(',').map(Number);
  cw = Math.min(cw, meta.width - cx);
  ch = Math.min(ch, meta.height - cy);
  const step = Number(args.step ?? (Math.max(cw, ch) > 1200 ? 100 : 50));
  const fs = Math.max(10, Math.round(Math.max(cw, ch) / 90));

  let svg = '';
  for (let x = Math.ceil(cx / step) * step; x <= cx + cw; x += step) {
    const major = x % (step * 5) === 0;
    svg += `<line x1="${x - cx}" y1="0" x2="${x - cx}" y2="${ch}" stroke="${major ? '#0066ff' : '#00a0ff'}" stroke-opacity="${major ? 0.8 : 0.45}" stroke-width="${major ? 2 : 1}"/>`;
    svg += `<text x="${x - cx + 2}" y="${fs}" font-family="Menlo, monospace" font-size="${fs}" fill="#0044cc" stroke="#ffffff" stroke-width="3" paint-order="stroke">${x}</text>`;
  }
  for (let y = Math.ceil(cy / step) * step; y <= cy + ch; y += step) {
    const major = y % (step * 5) === 0;
    svg += `<line x1="0" y1="${y - cy}" x2="${cw}" y2="${y - cy}" stroke="${major ? '#0066ff' : '#00a0ff'}" stroke-opacity="${major ? 0.8 : 0.45}" stroke-width="${major ? 2 : 1}"/>`;
    svg += `<text x="2" y="${y - cy - 2}" font-family="Menlo, monospace" font-size="${fs}" fill="#0044cc" stroke="#ffffff" stroke-width="3" paint-order="stroke">${y}</text>`;
  }
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">${svg}</svg>`;
  await sharp(input)
    .extract({ left: cx, top: cy, width: cw, height: ch })
    .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
    .png()
    .toFile(output);
  console.log(`出力: ${path.relative(process.cwd(), output)}（範囲 x=${cx} y=${cy} w=${cw} h=${ch}、目盛り ${step}px）`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

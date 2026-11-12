#!/usr/bin/env node
// 注釈指示のJSONに従って、画像に赤枠・番号付きの丸・矢印・テキスト・ぼかしを描くスクリプト
//
// 使い方:
//   node annotate.mjs <spec.json>
//
// JSONの仕様は ../SKILL.md の「注釈JSONの仕様」を参照。
// 座標はすべて元画像のピクセル座標（左上が原点）。
// 線の太さや文字サイズの既定値は「mdで表示される幅（displayWidth）」で見たときの大きさで決め、
// 元画像の幅に合わせて自動で拡大する（Retinaのスクショを width="450px" で表示しても細くならないように）。
//
// 描画後、各注釈が画像からはみ出していないかを確認し、はみ出しがあれば警告を出す。

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const FONT_FAMILY = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Noto Sans JP', 'Yu Gothic', sans-serif";

// 表示幅（displayWidth）で見たときの既定値（px）
const BASE = {
  color: '#E53935',
  strokeWidth: 3,
  radius: 4,
  fontSize: 14,
  badgeRadius: 10,
  arrowHead: 12,
  padding: 4,
  blurSigma: 12,
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 文字幅のざっくりした見積もり（全角は1em、半角は0.6em）
function textWidth(text, fontSize) {
  let w = 0;
  for (const ch of text) w += ch.codePointAt(0) > 0x2e80 ? 1.05 : 0.62;
  return w * fontSize;
}

function buildContext(spec, meta) {
  const displayWidth = spec.displayWidth ?? 600;
  const s = Math.max(1, meta.width / displayWidth);
  const d = { ...BASE, ...(spec.defaults ?? {}) };
  // defaults の数値も表示幅基準として扱う（color はそのまま）
  const px = (v) => v * s;
  return { s, d, px, width: meta.width, height: meta.height };
}

// 各注釈を SVG 断片に変換し、同時に占有範囲 [x0, y0, x1, y1] を返す
function render(a, ctx) {
  const { d, px } = ctx;
  const color = a.color ?? d.color;
  const sw = a.strokeWidth != null ? px(a.strokeWidth) : px(d.strokeWidth);

  switch (a.type) {
    case 'rect': {
      const r = a.radius != null ? px(a.radius) : px(d.radius);
      const fill = a.fill ?? 'none';
      return {
        svg: `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`,
        box: [a.x - sw / 2, a.y - sw / 2, a.x + a.w + sw / 2, a.y + a.h + sw / 2],
      };
    }
    case 'ellipse': {
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      return {
        svg: `<ellipse cx="${cx}" cy="${cy}" rx="${a.w / 2}" ry="${a.h / 2}" fill="${a.fill ?? 'none'}" stroke="${color}" stroke-width="${sw}"/>`,
        box: [a.x - sw / 2, a.y - sw / 2, a.x + a.w + sw / 2, a.y + a.h + sw / 2],
      };
    }
    case 'number': {
      // 番号付きの丸。x, y は円の中心
      const r = a.r != null ? px(a.r) : px(d.badgeRadius);
      const label = String(a.label ?? '');
      const fs = r * (label.length > 1 ? 1.1 : 1.3);
      const ring = Math.max(1.5, r * 0.15);
      return {
        svg:
          `<circle cx="${a.x}" cy="${a.y}" r="${r}" fill="${color}" stroke="${a.ringColor ?? '#ffffff'}" stroke-width="${ring}"/>` +
          `<text x="${a.x}" y="${a.y}" font-family="${FONT_FAMILY}" font-size="${fs}" font-weight="bold" fill="${a.textColor ?? '#ffffff'}" text-anchor="middle" dominant-baseline="central">${esc(label)}</text>`,
        box: [a.x - r - ring / 2, a.y - r - ring / 2, a.x + r + ring / 2, a.y + r + ring / 2],
      };
    }
    case 'arrow': {
      // from の点から to の点へ。矢じりは to 側
      const [x1, y1] = a.from;
      const [x2, y2] = a.to;
      const head = a.headSize != null ? px(a.headSize) : px(d.arrowHead);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      // 線の先端が矢じりから飛び出さないよう、矢じりの根元で止める
      const bx = x2 - Math.cos(ang) * head * 0.8, by = y2 - Math.sin(ang) * head * 0.8;
      const p1 = [x2 - head * Math.cos(ang - Math.PI / 7), y2 - head * Math.sin(ang - Math.PI / 7)];
      const p2 = [x2 - head * Math.cos(ang + Math.PI / 7), y2 - head * Math.sin(ang + Math.PI / 7)];
      const xs = [x1, x2, p1[0], p2[0]], ys = [y1, y2, p1[1], p2[1]];
      return {
        svg:
          `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>` +
          `<polygon points="${x2},${y2} ${p1.join(',')} ${p2.join(',')}" fill="${color}" stroke="${color}" stroke-width="${sw / 2}" stroke-linejoin="round"/>`,
        box: [Math.min(...xs) - sw, Math.min(...ys) - sw, Math.max(...xs) + sw, Math.max(...ys) + sw],
      };
    }
    case 'text': {
      // x, y は anchor で決まる基準点（既定は文字ボックスの左上）。改行は \n
      const fs = a.fontSize != null ? px(a.fontSize) : px(d.fontSize);
      const pad = a.padding != null ? px(a.padding) : px(d.padding);
      const lines = String(a.text ?? '').split('\n');
      const lh = fs * 1.3;
      const tw = Math.max(...lines.map((l) => textWidth(l, fs)));
      const bw = tw + pad * 2, bh = lh * lines.length + pad * 2 - (lh - fs);
      const anchor = a.anchor ?? 'top-left';
      let bx = a.x, by = a.y;
      if (anchor.includes('center') || anchor === 'center') bx = a.x - bw / 2;
      if (anchor.includes('right')) bx = a.x - bw;
      if (anchor.startsWith('middle') || anchor === 'center') by = a.y - bh / 2;
      if (anchor.startsWith('bottom')) by = a.y - bh;
      const bg = a.background === undefined ? '#ffffff' : a.background;
      const border = a.border ?? color;
      const textColor = a.textColor ?? color;
      let svg = '';
      if (bg) {
        svg += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${pad}" ry="${pad}" fill="${bg}" fill-opacity="${a.backgroundOpacity ?? 0.92}"` +
          (border ? ` stroke="${border}" stroke-width="${Math.max(1, sw / 2)}"` : '') + '/>';
      }
      lines.forEach((l, i) => {
        svg += `<text x="${bx + pad}" y="${by + pad + i * lh + fs * 0.88}" font-family="${FONT_FAMILY}" font-size="${fs}" font-weight="${a.bold === false ? 'normal' : 'bold'}" fill="${textColor}">${esc(l)}</text>`;
      });
      return { svg, box: [bx, by, bx + bw, by + bh] };
    }
    case 'blur':
      return { svg: '', box: [a.x, a.y, a.x + a.w, a.y + a.h] };
    default:
      throw new Error(`未知の注釈タイプ: ${a.type}`);
  }
}

async function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('使い方: node annotate.mjs <spec.json>');
    process.exit(1);
  }
  const specDir = path.dirname(path.resolve(specPath));
  const spec = JSON.parse(await fs.readFile(specPath, 'utf8'));
  const input = path.resolve(specDir, spec.input);
  const output = path.resolve(specDir, spec.output ?? spec.input.replace(/(\.\w+)$/, '.annotated$1'));
  if (input === output) throw new Error('output が input と同じです。別のパスを指定してください');

  const meta = await sharp(input).metadata();
  const ctx = buildContext(spec, meta);
  const annotations = spec.annotations ?? [];

  // 1) ぼかし（ラスタ処理）を先に適用する
  let base = await sharp(input).ensureAlpha().png().toBuffer();
  for (const a of annotations.filter((a) => a.type === 'blur')) {
    const left = Math.max(0, Math.round(a.x)), top = Math.max(0, Math.round(a.y));
    const width = Math.min(meta.width - left, Math.round(a.w)), height = Math.min(meta.height - top, Math.round(a.h));
    const sigma = a.sigma != null ? ctx.px(a.sigma) : ctx.px(ctx.d.blurSigma);
    const patch = await sharp(base).extract({ left, top, width, height }).blur(Math.max(0.3, sigma)).toBuffer();
    base = await sharp(base).composite([{ input: patch, left, top }]).png().toBuffer();
  }

  // 2) それ以外の注釈をSVGにまとめて重ねる（配列の順に描くので、後のものが上になる）
  const warnings = [];
  const parts = annotations.map((a, i) => {
    const { svg, box } = render(a, ctx);
    const [x0, y0, x1, y1] = box;
    if (x0 < 0 || y0 < 0 || x1 > meta.width || y1 > meta.height) {
      warnings.push(`#${i} ${a.type}${a.label ? `(${a.label})` : ''}${a.text ? `「${a.text}」` : ''} が画像からはみ出しています: ` +
        `[${box.map((v) => Math.round(v)).join(', ')}]（画像 ${meta.width}x${meta.height}）`);
    }
    return svg;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}">${parts.join('')}</svg>`;

  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp(base).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toFile(output);

  console.log(`出力: ${path.relative(process.cwd(), output)}（${meta.width}x${meta.height}、表示幅 ${spec.displayWidth ?? 600}px 基準・倍率 ${ctx.s.toFixed(2)}）`);
  if (warnings.length) {
    console.log('警告:');
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

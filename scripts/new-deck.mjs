#!/usr/bin/env node
// usage: node scripts/new-deck.mjs <YYYYMMDD_name> [--title "発表タイトル"]
// デッキを用意し、inbox/ の画像とメモを取り込む。既存のデッキに対して実行すると、追加分だけを取り込む。
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(ROOT, 'inbox');
const MAX_EDGE = 2400;

const args = process.argv.slice(2);
const titleAt = args.indexOf('--title');
const title = titleAt >= 0 ? args[titleAt + 1] : '';
const name = args.find((a, i) => !a.startsWith('--') && (titleAt < 0 || i !== titleAt + 1));
if (!name || !/^\d{8}_[a-z0-9-]+$/.test(name)) {
  console.error('usage: node scripts/new-deck.mjs <YYYYMMDD_英小文字の名前> [--title "発表タイトル"]');
  process.exit(1);
}

const hasSips = (() => {
  try { execFileSync('sips', ['--help'], { stdio: 'ignore' }); return true; } catch { return false; }
})();

// ---------- 位置情報などのメタデータを消す ----------
function orientationOf(exif) {
  // exif: "Exif\0\0" に続く TIFF
  const t = exif.subarray(6);
  if (t.length < 8) return 1;
  const le = t.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o));
  const u32 = (o) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
  const ifd = u32(4);
  if (ifd + 2 > t.length) return 1;
  const n = u16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > t.length) break;
    if (u16(e) === 0x0112) return u16(e + 8);
  }
  return 1;
}

function orientationSegment(o) {
  const body = Buffer.from([
    0x45, 0x78, 0x69, 0x66, 0, 0, // Exif\0\0
    0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, // big endian TIFF, IFD0 at 8
    0, 1, // 1 entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, // Orientation, SHORT
    0, 0, 0, 0, // no next IFD
  ]);
  const seg = Buffer.alloc(4);
  seg[0] = 0xff; seg[1] = 0xe1; seg.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([seg, body]);
}

function stripJpeg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const keep = [];
  let orientation = 1;
  let p = 2;
  while (p + 4 <= buf.length) {
    if (buf[p] !== 0xff) break;
    const m = buf[p + 1];
    if (m === 0xda) break; // 画像データ開始
    const len = buf.readUInt16BE(p + 2);
    const seg = buf.subarray(p, p + 2 + len);
    if (m === 0xe1 && seg.toString('latin1', 4, 10) === 'Exif\0\0') orientation = orientationOf(seg.subarray(4));
    if (m !== 0xe1 && m !== 0xed && m !== 0xfe) keep.push(seg); // APP1(Exif/XMP), APP13(IPTC), COM を落とす
    p += 2 + len;
  }
  // JFIF(APP0) は先頭のまま、その直後に向きの情報だけを戻す
  const jfif = keep[0]?.[1] === 0xe0 ? keep.shift() : null;
  const head = [buf.subarray(0, 2)];
  if (jfif) head.push(jfif);
  if (orientation !== 1) head.push(orientationSegment(orientation));
  return Buffer.concat([...head, ...keep, buf.subarray(p)]);
}

function stripPng(buf) {
  const sig = 8;
  if (buf.toString('latin1', 1, 4) !== 'PNG') return buf;
  const out = [buf.subarray(0, sig)];
  let p = sig;
  while (p + 12 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    const end = p + 12 + len;
    if (!['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME'].includes(type)) out.push(buf.subarray(p, end));
    p = end;
  }
  return Buffer.concat(out);
}

// ---------- 取り込み ----------
const IMAGE = new Set(['.jpg', '.jpeg', '.png']);
const CONVERT = new Set(['.heic', '.heif', '.tif', '.tiff']);
const AS_IS = new Set(['.gif', '.svg']);
const UNSTRIPPABLE = new Set(['.webp', '.mp4', '.mov', '.m4v', '.webm']);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.name === '_used') return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function sizeOf(path) {
  if (!hasSips) return null;
  try {
    const o = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const w = /pixelWidth: (\d+)/.exec(o); const h = /pixelHeight: (\d+)/.exec(o);
    return w && h ? [Number(w[1]), Number(h[1])] : null;
  } catch { return null; }
}

const deck = join(ROOT, 'decks', name);
const images = join(deck, 'images');
const notes = join(deck, 'notes');
const used = join(INBOX, '_used', name);
mkdirSync(images, { recursive: true });

const tag = name.slice(0, 8);
if (!existsSync(join(deck, 'deck.json'))) {
  writeFileSync(join(deck, 'deck.json'), JSON.stringify({ title: title || name, date: `${tag.slice(0, 4)}-${tag.slice(4, 6)}-${tag.slice(6, 8)}`, event: '#IoTLT', published: false }, null, 2) + '\n');
}
if (!existsSync(join(deck, 'index.html'))) {
  writeFileSync(join(deck, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title || name}</title>
<link rel="stylesheet" href="../../design-system/tokens.css">
<link rel="stylesheet" href="../../design-system/project/components/bundle.css">
<script src="../../design-system/project/components/bundle.js"></script>
</head>
<body>
<main class="lt-deck">
  <!-- ここにスライド -->
</main>
<script>IoTLT.Deck.mount();</script>
</body>
</html>
`);
}

const listPath = join(deck, 'images.md');
let list = existsSync(listPath) ? readFileSync(listPath, 'utf8') : '# 取り込んだ画像（撮影・保存が古い順）\n\n| ファイル | 大きさ | 元のファイル名 |\n| --- | --- | --- |\n';
let number = readdirSync(images).length;

const files = walk(INBOX).sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
const warnings = [];
let imported = 0;
let noted = 0;

for (const src of files) {
  const ext = extname(src).toLowerCase();
  const known = IMAGE.has(ext) || CONVERT.has(ext) || AS_IS.has(ext) || UNSTRIPPABLE.has(ext);
  if (!known) {
    mkdirSync(notes, { recursive: true });
    copyFileSync(src, join(notes, basename(src)));
    noted++;
  } else {
    if (CONVERT.has(ext) && !hasSips) {
      warnings.push(`${basename(src)}: この環境では変換できないので inbox に残しました`);
      continue;
    }
    number++;
    const slug = basename(src, extname(src)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const outExt = CONVERT.has(ext) ? '.jpg' : ext === '.jpeg' ? '.jpg' : ext;
    const file = `${String(number).padStart(2, '0')}${slug ? `-${slug}` : ''}${outExt}`;
    const out = join(images, file);
    if (CONVERT.has(ext)) {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', src, '--out', out], { stdio: 'ignore' });
    } else {
      copyFileSync(src, out);
    }
    if (IMAGE.has(outExt) || outExt === '.jpg') {
      const s = sizeOf(out);
      if (s && Math.max(...s) > MAX_EDGE) execFileSync('sips', ['-Z', String(MAX_EDGE), out], { stdio: 'ignore' });
      const buf = readFileSync(out);
      writeFileSync(out, outExt === '.png' ? stripPng(buf) : stripJpeg(buf));
    }
    if (UNSTRIPPABLE.has(ext)) warnings.push(`${file}: 位置情報を消せない形式です。公開するなら確認してください`);
    const s = sizeOf(out);
    list += `| images/${file} | ${s ? `${s[0]}×${s[1]}` : '-'} | ${basename(src).replaceAll('|', ' ')} |\n`;
    imported++;
  }
  // 元のファイルは消さず inbox/_used/ に移す
  mkdirSync(used, { recursive: true });
  let dest = join(used, basename(src));
  for (let i = 1; existsSync(dest); i++) dest = join(used, `${i}-${basename(src)}`);
  renameSync(src, dest);
}
if (imported) writeFileSync(listPath, list);

console.log(`decks/${name}`);
console.log(`画像 ${imported} 個、メモなど ${noted} 個を取り込みました`);
for (const w of warnings) console.log(`注意: ${w}`);

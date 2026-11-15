#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const [input, destination] = process.argv.slice(2);
if (!input || !destination) {
  console.error('使い方: npm run qr -- <URL> <出力先.png>');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(input);
} catch {
  console.error('URLを確認してください。');
  process.exit(1);
}
if (!['http:', 'https:'].includes(parsed.protocol)) {
  console.error('http または https のURLを指定してください。');
  process.exit(1);
}

const output = resolve(destination);
if (extname(output).toLowerCase() !== '.png') {
  console.error('出力先は .png にしてください。');
  process.exit(1);
}

await mkdir(dirname(output), { recursive: true });
await QRCode.toFile(output, input, {
  width: 1200,
  margin: 4,
  errorCorrectionLevel: 'Q',
  color: { dark: '#000000', light: '#FFFFFF' },
});

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoPath = relative(root, output);
console.log(`QRコードを保存しました: ${repoPath.startsWith('..') ? output : repoPath}`);

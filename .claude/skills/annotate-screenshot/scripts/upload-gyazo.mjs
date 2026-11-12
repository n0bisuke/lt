#!/usr/bin/env node
// 画像を1枚Gyazoにアップロードし、埋め込み用のURLを出力するスクリプト
//
// 使い方:
//   node upload-gyazo.mjs <image> [--desc "説明"]
//
// アクセストークンは環境変数 GYAZO_ACCESS_TOKEN から読む。
// 未設定なら、作業対象のリポジトリ直下の .env を読み込む。トークンの値は出力しない。
// 出力（JSON）: { "image_id", "url"（https://i.gyazo.com/<ID>.png）, "permalink_url" }

import fs from 'node:fs/promises';
import path from 'node:path';

import { ROOT, exists } from './gyazo-common.mjs';

async function main() {
  const argv = process.argv.slice(2);
  const image = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--desc');
  const desc = argv.includes('--desc') ? argv[argv.indexOf('--desc') + 1] : undefined;
  if (!image) {
    console.error('使い方: node upload-gyazo.mjs <image> [--desc "説明"]');
    process.exit(1);
  }

  const envFile = path.join(ROOT, '.env');
  if (!process.env.GYAZO_ACCESS_TOKEN && (await exists(envFile))) process.loadEnvFile(envFile);
  const token = process.env.GYAZO_ACCESS_TOKEN;
  if (!token) {
    console.error('GYAZO_ACCESS_TOKEN が設定されていません。環境変数か、作業対象のリポジトリ直下の .env に設定してください');
    process.exit(1);
  }

  const form = new FormData();
  form.append('access_token', token);
  form.append('imagedata', new Blob([await fs.readFile(image)], { type: 'image/png' }), path.basename(image));
  if (desc) form.append('desc', desc);

  const res = await fetch('https://upload.gyazo.com/api/upload', { method: 'POST', body: form });
  const body = await res.text();
  if (!res.ok) throw new Error(`アップロード失敗: HTTP ${res.status} ${body.slice(0, 200)}`);
  const json = JSON.parse(body);
  console.log(JSON.stringify({ image_id: json.image_id, url: json.url, permalink_url: json.permalink_url }, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

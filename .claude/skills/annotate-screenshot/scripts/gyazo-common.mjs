// annotate-screenshot スキルのスクリプトで共通に使う定数と関数

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

// 作業対象のリポジトリ直下。スキルはプラグインのキャッシュなど別の場所に置かれるので、
// スクリプトの場所ではなく、実行したフォルダ（cwd）から求める。Gitの外ならcwdをそのまま使う。
export const ROOT = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return process.cwd();
  }
})();

// i.gyazo.com/<ID>.<拡張子> と gyazo.com/<ID>（パーマリンク）の両方に一致する
// m[1]: 32桁のID、m[2]: 拡張子（パーマリンクのときは undefined）
export const GYAZO_RE = /https?:\/\/(?:i\.)?gyazo\.com\/([0-9a-f]{32})(?:\.(png|jpe?g|gif|mp4|webp))?/g;

export const toPosix = (p) => p.split(path.sep).join('/');

export async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

#!/bin/bash
# Legacy entry point: Node.js / Fullbleed で PDF とサムネイルを出力（ブラウザー不使用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node scripts/export-pdf.mjs "$@"

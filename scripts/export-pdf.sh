#!/bin/bash
# Legacy entry point: Node.js / Playwright で PDF とサムネイルを出力
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node scripts/export-pdf.mjs "$@"

#!/bin/bash
# usage: scripts/export-pdf.sh decks/<deck> → decks/<deck>/<deck>.pdf (1920×1080, 1枚1ページ) と thumbnail.png (1枚目)
set -euo pipefail
DECK_DIR="$(cd "$1" && pwd)"
NAME="$(basename "$DECK_DIR")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node "$ROOT/scripts/build-tokens.mjs" >/dev/null

BROWSER=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev" \
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"; do
  [ -x "$c" ] && BROWSER="$c" && break
done
[ -n "$BROWSER" ] || { echo "Chrome 系ブラウザが見つかりません" >&2; exit 1; }

PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT
"$BROWSER" --headless=new --disable-gpu --user-data-dir="$PROFILE" --no-pdf-header-footer \
  --virtual-time-budget=4000 --print-to-pdf="$DECK_DIR/$NAME.pdf" "file://$DECK_DIR/index.html" 2>/dev/null
"$BROWSER" --headless=new --disable-gpu --user-data-dir="$PROFILE" --hide-scrollbars --window-size=1280,720 \
  --virtual-time-budget=4000 --screenshot="$DECK_DIR/thumbnail.png" "file://$DECK_DIR/index.html#1" 2>/dev/null
echo "$DECK_DIR/$NAME.pdf"
echo "$DECK_DIR/thumbnail.png"
grep -c 'lt-slot' "$DECK_DIR/index.html" | xargs -I{} echo "未差し替えの lt-slot: {} 個"

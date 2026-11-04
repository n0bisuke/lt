#!/bin/bash
# usage: scripts/export-pdf.sh decks/<deck> → decks/<deck>/<deck>.pdf (1920×1080, 1枚1ページ) と thumbnail.png (1枚目)
set -euo pipefail
DECK_DIR="$(cd "$1" && pwd)"
NAME="$(basename "$DECK_DIR")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if grep -q '"source": "pdf"' "$DECK_DIR/deck.json" 2>/dev/null; then
  echo "$NAME は PDF から取り込んだデッキです。元の PDF を上書きしないよう書き出しません" >&2
  exit 1
fi

node "$ROOT/scripts/build-tokens.mjs" >/dev/null

# Markdown のデッキは deck.html を作ってから書き出す
PAGE="index.html"
SOURCE="index.html"
if [ -f "$DECK_DIR/deck.md" ]; then
  node "$ROOT/scripts/build-deck.mjs" "$DECK_DIR" >/dev/null
  PAGE="deck.html"
  SOURCE="deck.md"
fi

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
  --virtual-time-budget=4000 --print-to-pdf="$DECK_DIR/$NAME.pdf" "file://$DECK_DIR/$PAGE" 2>/dev/null
"$BROWSER" --headless=new --disable-gpu --user-data-dir="$PROFILE" --hide-scrollbars --window-size=1280,720 \
  --virtual-time-budget=4000 --screenshot="$DECK_DIR/thumbnail.png" "file://$DECK_DIR/$PAGE#1" 2>/dev/null
echo "$DECK_DIR/$NAME.pdf"
echo "$DECK_DIR/thumbnail.png"
echo "未差し替えの lt-slot: $(grep -c 'lt-slot' "$DECK_DIR/$SOURCE" || true) 個"

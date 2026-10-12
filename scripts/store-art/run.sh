#!/usr/bin/env bash
# Regenerates every picture of the app from the app itself:
# App Store screenshots, two social videos, and the README images.
#
#   npm run store-art
#
# Needs Playwright with Chromium (npx playwright install chromium) and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/../.."
HERE=scripts/store-art
PORT=${PORT:-8099}

echo "→ Building the web version of the app"
CI=1 npx expo export -p web --output-dir "$HERE/.cache/web" >/dev/null

echo "→ Serving it on :$PORT"
node "$HERE/serve.js" "$HERE/.cache/web" "$PORT" &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

echo "→ Playing a game and capturing the screens"
node "$HERE/capture.js" "http://localhost:$PORT/" "$HERE/.cache/screens"

echo "→ Recording a round for the gameplay GIF"
node "$HERE/capture.js" "http://localhost:$PORT/" "$HERE/.cache/gif" --gif

echo "→ Rendering"
node "$HERE/render.js"

echo "Done: $HERE/out (store screenshots and videos) and docs/images (README)."

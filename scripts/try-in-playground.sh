#!/usr/bin/env bash
# Export the sample theme and open it in a local WordPress Playground.
# Usage: npm run try
set -euo pipefail
cd "$(dirname "$0")/.."
THEME_DIR=$(npx tsx scripts/export-theme.ts out scripts/sample-state.json)
SLUG=$(basename "$THEME_DIR")
sed "s/__SLUG__/$SLUG/" scripts/test-blueprint.json > out/blueprint.json
npx @wp-playground/cli@latest server \
  --mount="$PWD/$THEME_DIR:/wordpress/wp-content/themes/$SLUG" \
  --blueprint=out/blueprint.json

#!/usr/bin/env bash
# Regenerate the motion slide (and PNG preview) from its JSON config.
# Requires: Node.js. PNG preview additionally requires LibreOffice (soffice).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/deck/motion-sql.json"
OUTPUT="$ROOT/deck/MotionSQL-Azure.pptx"
PREVIEW_DIR="$ROOT/deck/preview"
SKILL="$ROOT/skill/pptxmotions"

echo "==> Installing generator dependencies"
( cd "$SKILL" && npm install --silent )

echo "==> Building slide: $OUTPUT"
node "$SKILL/motion.js" "$CONFIG" "$OUTPUT"

if command -v soffice >/dev/null 2>&1; then
  echo "==> Rendering PNG preview"
  mkdir -p "$PREVIEW_DIR"
  soffice --headless --convert-to png --outdir "$PREVIEW_DIR" "$OUTPUT"
else
  echo "!! LibreOffice (soffice) not found - skipping PNG preview"
fi

echo "Done."

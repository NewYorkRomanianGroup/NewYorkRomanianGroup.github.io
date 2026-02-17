#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   export GOOGLE_API_KEY="..."
#   ./scripts/update_gallery_json.sh "YOUR_FOLDER_ID"

FOLDER_ID="${1:-}"
if [[ -z "$FOLDER_ID" ]]; then
  echo "Usage: $0 FOLDER_ID"
  exit 1
fi

python3 scripts/update_gallery_json.py --folder-id "$FOLDER_ID" --out "data/gallery.json"

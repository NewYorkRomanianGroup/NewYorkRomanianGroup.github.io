#!/usr/bin/env bash
set -euo pipefail

# scripts/update_gallery_json.sh
#
# Usage:
#   export GOOGLE_API_KEY="..."
#   export NYRG_EXTERNAL_EVENTS_CSV_URL="https://...output=csv"   # optional
#   export NYRG_GDRIVE_FOLDER_ID="1qHFOROkuAI5sICLSSxj0Bg_b5QxqTp4u"
#   cd scripts
#   bash ./update_gallery_json.sh "$NYRG_GDRIVE_FOLDER_ID"

FOLDER_ID="${1:-}"
if [[ -z "$FOLDER_ID" ]]; then
  echo "Usage: $0 FOLDER_ID"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

python3 "$SCRIPT_DIR/update_gallery_json.py" \
  --folder-id "$FOLDER_ID" \
  --out "$REPO_ROOT/data/gallery.json"
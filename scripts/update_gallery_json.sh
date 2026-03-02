#!/usr/bin/env bash
set -euo pipefail

# Required env vars (provided by systemd EnvironmentFile):
# - GOOGLE_API_KEY
# - NYRG_GDRIVE_FOLDER_ID
#
# Optional env vars:
# - NYRG_EXTERNAL_EVENTS_CSV_URL   (Google Sheet published as CSV; external events only)

FOLDER_ID="${1:-}"
if [[ -z "$FOLDER_ID" ]]; then
  echo "Usage: $0 FOLDER_ID"
  exit 1
fi

python3 update_gallery_json.py \
  --folder-id "$FOLDER_ID" \
  --out "data/gallery.json"
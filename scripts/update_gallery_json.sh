#!/usr/bin/env bash
set -euo pipefail

echo "[NYRG] external CSV url (env) = ${NYRG_EXTERNAL_EVENTS_CSV_URL:-<unset>}"

# ---------------- COLLABORATOR NOTE -------------------------
# This script is a thin wrapper around update_gallery_json.py.
# It writes the output to: data/gallery.json (repo root)
#
# External events are optional and come from a Google Sheet published as CSV.
# If you do not use external events, leave NYRG_EXTERNAL_EVENTS_CSV_URL unset.
# ------------------------------------------------------------
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


# ------------------------------------------------------------
# Troubleshooting (quick)
# ------------------------------------------------------------
# - "Missing ... env var": your environment file is not loaded.
#   If you use systemd, confirm the unit uses EnvironmentFile=~/.config/nyrg/nyrg.env
#   If running manually, export the variable in your shell first.
#
# - "Working tree has unrelated changes": commit/stash your work first.
#   These scripts are intentionally strict so automation does not accidentally
#   commit unrelated edits.
#
# - "Not pushing (not on main)": switch to main if this is meant to be the
#   automated daily commit. For feature branches, commit manually and open a PR.
# ------------------------------------------------------------

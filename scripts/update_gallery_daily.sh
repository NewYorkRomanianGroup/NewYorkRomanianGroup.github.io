#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Daily Google Drive gallery.json updater (systemd)
#
# Uses the existing manual runner:
#   scripts/update_gallery_json.sh
#
# This wrapper adds:
# - clean working tree guard
# - commit only if data/gallery.json changed
# - push only on main
#
# Required env vars (provided by systemd EnvironmentFile):
# - GOOGLE_API_KEY
# - NYRG_GDRIVE_FOLDER_ID
# ============================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/gallery.json"
RUNNER_SH="scripts/update_gallery_json.sh"

: "${GOOGLE_API_KEY:?Missing GOOGLE_API_KEY env var}"
: "${NYRG_GDRIVE_FOLDER_ID:?Missing NYRG_GDRIVE_FOLDER_ID env var}"

# Safety: do not run if there are unrelated uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[NYRG] Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Run the existing manual updater (writes data/gallery.json)
bash "$RUNNER_SH" "$NYRG_GDRIVE_FOLDER_ID"

git add "$JSON_PATH"

if git diff --cached --quiet; then
  echo "[NYRG] No changes to commit."
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "[NYRG] On branch '$BRANCH'. Not pushing."
  exit 1
fi

git commit -m "Update gallery.json (daily)"
git push origin main

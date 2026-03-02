# ----------------------------------------------------------
# Wait for DNS before attempting Google API calls
# Prevents writing 0 images when network is not ready
# ----------------------------------------------------------
for i in {1..24}; do
  if getent hosts www.googleapis.com >/dev/null 2>&1; then
    break
  fi
  sleep 5
done

if ! getent hosts www.googleapis.com >/dev/null 2>&1; then
  echo "[NYRG] DNS unavailable. Aborting update."
  exit 1
fi


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

# Safety: do not commit empty results (usually means network or permissions issue)
if python3 -c 'import json; d=json.load(open("data/gallery.json")); print(len(d.get("images", [])), len(d.get("events", [])))' | awk '{exit !($1==0 && $2==0)}'; then
  echo "[NYRG] gallery.json contains 0 images and 0 events. Aborting commit."
  exit 1
fi

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

#!/usr/bin/env bash
set -euo pipefail

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

# ---------------- COLLABORATOR NOTE -------------------------
# This is intended for systemd automation (daily refresh of data/gallery.json).
# It wraps scripts/update_gallery_json.sh and commits only if gallery.json changed.
#
# If you are just testing, run:
#   bash scripts/update_gallery_json.sh "$NYRG_GDRIVE_FOLDER_ID"
# ------------------------------------------------------------
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

# If umbrella is orchestrating, it will do the git commit/push once at the end.
if [[ "${NYRG_SKIP_GIT:-0}" == "1" ]]; then
  echo "[NYRG] NYRG_SKIP_GIT=1, will skip git commit/push (umbrella will handle it)."
  SKIP_GIT=1
else
  SKIP_GIT=0
fi

# Safety: do not run if there are unrelated uncommitted changes
# Allow ONLY data/gallery.json to change (everything else must be clean).
if git status --porcelain --untracked-files=no \
  | grep -vqE "^[ MARC?]{1,2}[[:space:]]+$JSON_PATH$"
then
  echo "[NYRG] Working tree has unrelated changes (not $JSON_PATH). Commit or stash them first."
  git status --porcelain
  exit 1
fi

# Run the existing manual updater (writes data/gallery.json)
bash "$RUNNER_SH" "$NYRG_GDRIVE_FOLDER_ID"

if [[ "$SKIP_GIT" == "1" ]]; then
  exit 0
fi

if [[ "$SKIP_GIT" == "0" ]]; then
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

fi

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

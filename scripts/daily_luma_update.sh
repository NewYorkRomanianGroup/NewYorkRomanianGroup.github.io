#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Daily Luma JSON updater
#
# What this script does:
# 1) Runs the scraper to refresh data/luma.json
# 2) Commits the change if (and only if) the JSON changed
# 3) Pushes to origin/main
#
# Notes:
# - This script modifies ONLY luma.json.
# - If NYRG_SKIP_GIT=1, umbrella handles git.
# - If you do not have a .venv, it will fall back to python3.
# ============================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/luma.json"
SCRAPER_PATH="scripts/luma_scrape.py"

PY="$REPO_DIR/.venv/bin/python"
if [[ -x "$PY" ]]; then
  PYTHON="$PY"
else
  if command -v python3 >/dev/null 2>&1; then
    PYTHON="python3"
    echo "[NYRG] .venv not found, using python3 from PATH."
  else
    echo "[NYRG] Error: missing .venv and python3 is not available."
    exit 1
  fi
fi

if [[ "${NYRG_SKIP_GIT:-0}" == "1" ]]; then
  echo "[NYRG] NYRG_SKIP_GIT=1, will skip git commit/push (umbrella will handle it)."
  SKIP_GIT=1
else
  SKIP_GIT=0
fi

if [[ "$SKIP_GIT" == "0" ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "[NYRG] Working tree is not clean."
    echo "[NYRG] Please commit or stash your changes before running this script."
    exit 1
  fi
fi

"$PYTHON" "$SCRAPER_PATH"

if [[ "$SKIP_GIT" == "1" ]]; then
  exit 0
fi

git add "$JSON_PATH"

if git diff --cached --quiet; then
  echo "[NYRG] No changes to commit."
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "[NYRG] Current branch is '$BRANCH'."
  echo "[NYRG] Not pushing. Switch to 'main' if you want this automated commit on main."
  exit 1
fi

git commit -m "Update luma.json (daily)"
git push origin main

echo "[NYRG] Pushed."

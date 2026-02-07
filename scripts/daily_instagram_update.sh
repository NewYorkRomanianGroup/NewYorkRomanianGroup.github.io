#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Daily Instagram JSON updater
#
# What this script does:
# 1) Runs the Selenium scraper to refresh data/instagram.json
# 2) Commits the change if (and only if) the JSON changed
# 3) Pushes to origin/main
#
# Notes for collaborators:
# - This script modifies ONLY the instagram.json file (unless you changed other files).
# - If your working tree has other uncommitted edits, this script will exit for safety.
# - If you do not have a .venv, it will fall back to python3.
# ============================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/instagram.json"
SCRAPER_PATH="scripts/selenium_instagram_scrape.py"

# Prefer repo venv, but allow python3 fallback for convenience.
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

# Safety: do not run if there are unrelated uncommitted changes.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[NYRG] Working tree is not clean."
  echo "[NYRG] Please commit or stash your changes before running this script."
  exit 1
fi

# Run the scraper. It should only write JSON if it successfully finds posts.
"$PYTHON" "$SCRAPER_PATH"

# Stage just the JSON file. (Keeps commits tight and predictable.)
git add "$JSON_PATH"

# If nothing changed, exit cleanly.
if git diff --cached --quiet; then
  echo "[NYRG] No changes to commit."
  exit 0
fi

# Only push if we are on main (prevents accidentally pushing from a feature branch).
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "[NYRG] Current branch is '$BRANCH'."
  echo "[NYRG] Not pushing. Switch to 'main' if you want this automated commit on main."
  echo "[NYRG] You can still commit manually if desired."
  exit 1
fi

git commit -m "Update instagram.json (daily)"
git push origin main

echo "[NYRG] Pushed."

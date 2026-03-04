#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Daily Jobs JSON updater (systemd)
#
# 1) Runs scripts/update_jobs_json.py to refresh data/jobs.json
# 2) Commits ONLY if jobs.json changed
# 3) Pushes ONLY on main
#
# Required env vars (recommended via systemd EnvironmentFile):
# - NYRG_JOBS_CSV_URL
# ============================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/jobs.json"
GENERATOR="scripts/update_jobs_json.py"

: "${NYRG_JOBS_CSV_URL:?Missing NYRG_JOBS_CSV_URL env var}"

# Prefer repo venv, fall back to python3 (same style as IG scripts) :contentReference[oaicite:3]{index=3}
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
# Allow ONLY data/jobs.json to change (matches gallery pattern). :contentReference[oaicite:4]{index=4}
if git status --porcelain --untracked-files=no \
  | grep -vqE "^[ MARC?]{1,2}[[:space:]]+$JSON_PATH$"
then
  echo "[NYRG] Working tree has unrelated changes (not $JSON_PATH). Commit or stash them first."
  git status --porcelain
  exit 1
fi

"$PYTHON" "$GENERATOR"

# Stage just jobs.json
git add "$JSON_PATH"

# If nothing changed, exit cleanly
if git diff --cached --quiet; then
  echo "[NYRG] No changes to commit."
  exit 0
fi

# Only push on main
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "[NYRG] On branch '$BRANCH'. Not pushing."
  exit 1
fi

git commit -m "Update jobs.json (daily)"
git push origin main

echo "[NYRG] Pushed."
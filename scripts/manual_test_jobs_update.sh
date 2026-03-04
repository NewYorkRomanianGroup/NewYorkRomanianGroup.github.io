#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Test Jobs JSON update (manual, SAFE)
#
# - Updates data/jobs.json from the published Jobs sheet CSV
# - Shows diff if it changed
# - Does NOT commit or push
# ============================================================

# ---------------- COLLABORATOR NOTE -------------------------
# This jobs pipeline expects a Google Sheet that is published as CSV.
# Approved jobs are curated into the "For Show" tab by a Google Apps Script.
# (The Apps Script lives inside the Sheet, not in this repo by default.)
#
# Maintainer docs:
# - docs/jobs-pipeline.md
# - docs/google-apps-script/jobs_approval_and_email.js
# ------------------------------------------------------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/jobs.json"
GENERATOR="scripts/update_jobs_json.py"

# Prefer repo venv, fall back to python3 (same style as IG scripts) :contentReference[oaicite:2]{index=2}
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

: "${NYRG_JOBS_CSV_URL:?Missing NYRG_JOBS_CSV_URL env var}"

"$PYTHON" "$GENERATOR"

git add "$JSON_PATH"

if git diff --cached --quiet; then
  echo "[NYRG] No changes detected in $JSON_PATH."
  exit 0
fi

echo "[NYRG] Changes detected in $JSON_PATH:"
git --no-pager diff --cached -- "$JSON_PATH"

echo
echo "[NYRG] If everything looks good, commit + push with:"
echo "  git commit -m \"Update jobs.json (manual)\" && git push origin main"

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

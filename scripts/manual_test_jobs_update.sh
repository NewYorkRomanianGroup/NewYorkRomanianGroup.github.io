#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Test Jobs JSON update (manual, SAFE)
#
# - Updates data/jobs.json from the published Jobs sheet CSV
# - Shows diff if it changed
# - Does NOT commit or push
# ============================================================

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
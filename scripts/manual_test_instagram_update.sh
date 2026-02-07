#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NYRG: Test Instagram JSON update (manual, SAFE)
#
# What this script does:
# - Runs the scraper to refresh data/instagram.json
# - Shows whether the JSON changed
#
# What it does NOT do:
# - It does NOT commit
# - It does NOT push
#
# If you want to actually commit + push, run:
#   scripts/daily_instagram_update.sh
#
# (Or commit manually once you confirm the JSON looks correct.)
# ============================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

JSON_PATH="data/instagram.json"
SCRAPER_PATH="scripts/selenium_instagram_scrape.py"

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

# Run the scraper (should only write JSON if it successfully finds posts)
"$PYTHON" "$SCRAPER_PATH"

# Show if the JSON changed
git add "$JSON_PATH"

if git diff --cached --quiet; then
  echo "[NYRG] No changes detected in $JSON_PATH."
  exit 0
fi

echo "[NYRG] Changes detected in $JSON_PATH:"
git --no-pager diff --cached -- "$JSON_PATH"

echo
echo "[NYRG] If everything looks good, you can commit and push with:"
echo "  git commit -m \"Update instagram.json (manual)\" && git push origin main"
echo "  (or run scripts/daily_instagram_update.sh)"

#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

PY="$REPO_DIR/.venv/bin/python"
if [[ ! -x "$PY" ]]; then
  echo "[NYRG] Missing venv at $PY"
  exit 1
fi

"$PY" scripts/selenium_instagram_scrape.py

git add assets/instagram.json
if git diff --cached --quiet; then
  echo "[NYRG] No changes to commit."
  exit 0
fi

git commit -m "Update instagram.json (daily)"
git push origin main
echo "[NYRG] Pushed."

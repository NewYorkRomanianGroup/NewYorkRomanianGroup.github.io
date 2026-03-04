#!/usr/bin/env bash
set -u  # treat unset vars as errors

# Load your env (you already store vars here) :contentReference[oaicite:1]{index=1}
ENV_FILE="${HOME}/.config/nyrg/nyrg.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

# Repo root (assumes this script lives in repo/scripts/)
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR" || exit 2

# Log helper
ts() { date +"%Y-%m-%d %H:%M:%S"; }

# Run a step, but do not stop overall script
run_step () {
  local name="$1"; shift
  echo "[$(ts)] === ${name} ==="
  "$@"
  local rc=$?
  if [[ $rc -eq 0 ]]; then
    echo "[$(ts)] OK: ${name}"
  else
    echo "[$(ts)] FAIL(${rc}): ${name}"
  fi
  echo
  return $rc
}

fail_any=0

# IMPORTANT: replace these commands with your actual existing ones:
# - If you already have scripts like scripts/update_instagram_daily.sh, use those.
# - If you rely on python -m venv stuff, make sure your systemd unit sets PATH/VIRTUAL_ENV.

run_step "Instagram JSON" ./scripts/update_instagram_daily.sh || fail_any=1
run_step "Gallery JSON"   ./scripts/update_gallery_json.sh   || fail_any=1
run_step "Jobs JSON"      ./scripts/update_jobs_json.sh      || fail_any=1

# Choose ONE behavior:

# A) Never fail the umbrella job (it will still log failures)
# exit 0

# B) Mark umbrella job as failed if any step failed (still ran all steps)
exit $fail_any
#!/usr/bin/env bash
set -u  # treat unset vars as errors

# ============================================================
# NYRG: Update all JSONs (instagram + gallery + jobs)
#
# Goals:
# - Allow a dirty working tree (people may be editing the repo)
# - Still run all 3 updaters
# - If the JSONs are dirty/uncommitted, overwrite them with fresh output
# - Commit/push ONLY the 3 JSONs (never commit other changes)
#
# Strategy:
# 1) Stash ALL local changes (including the JSONs) to give updaters a clean base
# 2) Run each updater with NYRG_SKIP_GIT=1 (so they do not commit)
# 3) Restore the stash, but keep the freshly generated JSONs from step (2)
# 4) Stage/commit ONLY the 3 JSONs
# ============================================================

# Load env (you store vars here)
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

# --- 0) Stash everything so updaters can run against a clean tree ---
# This also handles your requirement: if JSONs are dirty/uncommitted,
# the run will override them with fresh output.
STASH_NAME="nyrg-pre-update-all-$(date +%Y%m%d-%H%M%S)"
had_stash=0

# Stage state doesn't matter, we explicitly avoid committing anything except JSONs.
# We stash tracked + untracked to avoid strict scripts failing.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "[$(ts)] Working tree is dirty. Stashing ALL changes before running updaters..."
  git stash push -u -m "$STASH_NAME" >/dev/null
  had_stash=1
else
  echo "[$(ts)] Working tree is clean."
fi
echo

# --- 1) Run the 3 updaters (no git inside them) ---
run_step "Instagram JSON" env NYRG_SKIP_GIT=1 ./scripts/daily_instagram_update.sh || fail_any=1
run_step "Gallery JSON"   env NYRG_SKIP_GIT=1 ./scripts/update_gallery_daily.sh   || fail_any=1
run_step "Jobs JSON"      env NYRG_SKIP_GIT=1 ./scripts/update_jobs_daily.sh      || fail_any=1

# --- 2) Restore previous local edits, but keep fresh JSON outputs ---
if [[ "$had_stash" == "1" ]]; then
  echo "[$(ts)] Restoring previous local changes (keeping freshly generated JSONs)..."

  # Save the freshly-generated JSONs to a temp dir
  tmpdir="$(mktemp -d)"
  cp -f data/instagram.json "$tmpdir/instagram.json" 2>/dev/null || true
  cp -f data/gallery.json   "$tmpdir/gallery.json"   2>/dev/null || true
  cp -f data/jobs.json      "$tmpdir/jobs.json"      2>/dev/null || true

  # Restore stash (brings back *all* prior edits)
  # If conflicts happen, we still force our JSONs afterward.
  git stash pop >/dev/null || true

  # Force the freshly generated JSONs back into place (override any stashed versions)
  if [[ -f "$tmpdir/instagram.json" ]]; then cp -f "$tmpdir/instagram.json" data/instagram.json; fi
  if [[ -f "$tmpdir/gallery.json" ]];   then cp -f "$tmpdir/gallery.json"   data/gallery.json;   fi
  if [[ -f "$tmpdir/jobs.json" ]];      then cp -f "$tmpdir/jobs.json"      data/jobs.json;      fi

  rm -rf "$tmpdir"

  echo "[$(ts)] Stash restored; JSONs kept from this run."
  echo
fi

# --- 3) Combined commit step (ONLY the 3 JSONs) ---
echo "[$(ts)] === Combined commit step ==="

# Ensure ONLY our 3 JSONs are staged (even if someone staged other files earlier)
git reset

# Stage just the JSONs (even if the tree has tons of other changes)
git add data/instagram.json data/gallery.json data/jobs.json

# If no JSON changes, do nothing
if git diff --cached --quiet; then
  echo "[NYRG] No JSON changes to commit."
  echo
else
  # Only push on main (safety)
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$BRANCH" != "main" ]]; then
    echo "[NYRG] On branch '$BRANCH'. Not pushing combined JSON update."
    echo
  else
    git commit -m "Update JSON data (daily)"
    git push origin main
    echo "[NYRG] Pushed combined JSON update."
    echo
  fi
fi

# Choose behavior:
# - Return nonzero if any step failed, even though we attempted all steps.
exit $fail_any
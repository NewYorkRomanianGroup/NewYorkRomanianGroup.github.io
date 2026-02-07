#!/usr/bin/env bash
set -euo pipefail

# ---------------- CONFIG ----------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JSON_PATH="$REPO_DIR/assets/instagram.json"
USERNAME="newyorkromaniangroup"
LIMIT=3
# ----------------------------------------

cd "$REPO_DIR"

echo "[NYRG] Weekly Instagram update started at $(date)"

# --- Fetch Instagram data (best effort) ---
NODE_OUTPUT="$(node - <<'NODE'
const USERNAME = "newyorkromaniangroup";
const LIMIT = 3;

async function run() {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`;
  const headers = {
    "user-agent": "Mozilla/5.0",
    "x-ig-app-id": "936619743392459",
    "accept": "*/*"
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.error(`[NYRG] Instagram blocked (${res.status}). Skipping update.`);
    process.exit(2);
  }

  const data = await res.json();
  const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || [];

  const posts = edges.slice(0, LIMIT)
    .map(e => e?.node?.shortcode)
    .filter(Boolean)
    .map(sc => ({ url: `https://www.instagram.com/p/${sc}/` }));

  if (posts.length === 0) {
    console.error("[NYRG] No posts found. Skipping update.");
    process.exit(2);
  }

  const payload = {
    updated_at: new Date().toISOString(),
    posts
  };

  console.log(JSON.stringify(payload, null, 2));
}

run().catch(() => process.exit(2));
NODE
)" || exit 0

# --- Write JSON ---
echo "$NODE_OUTPUT" > "$JSON_PATH"

# --- Commit only if changed ---
git add "$JSON_PATH"
if git diff --cached --quiet; then
  echo "[NYRG] No changes detected. Exiting."
  exit 0
fi

git commit -m "Update instagram.json (weekly)"
git push origin main

echo "[NYRG] Update pushed successfully."

/**
 * Scrape latest Instagram post URLs from a public profile using the web_profile_info endpoint.
 * This avoids brittle HTML parsing and is more reliable in GitHub Actions.
 *
 * Notes:
 * - Still best-effort. Instagram can rate-limit or change behavior.
 * - If it fails, check Actions logs and the site still shows the Follow button + profile link.
 */

import fs from "fs";
import path from "path";

const USERNAME = "newyorkromaniangroup";
const LIMIT = 3;

const OUTFILE = path.join(process.cwd(), "assets", "instagram.json");

async function main() {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`;

  // Commonly used web app id values seen in the wild and docs.
  // 936619743392459 is widely referenced for this endpoint. :contentReference[oaicite:1]{index=1}
  const headers = {
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "x-ig-app-id": "936619743392459"
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IG profile request failed: ${res.status} ${res.statusText}\n${text.slice(0, 300)}`);
  }

  const data = await res.json();

  // Depending on IG response shape, "data.user" should exist
  const user = data?.data?.user;
  const edges = user?.edge_owner_to_timeline_media?.edges || [];

  const posts = edges
    .map((e) => e?.node)
    .filter(Boolean)
    .slice(0, LIMIT)
    .map((node) => {
      // Build URLs from shortcode.
      // Reels sometimes show in the same feed, but shortcode URLs still work as /p/ most of the time.
      const shortcode = node.shortcode;
      return shortcode ? `https://www.instagram.com/p/${shortcode}/` : null;
    })
    .filter(Boolean)
    .map((url) => ({ url }));

  const payload = {
    updated_at: new Date().toISOString(),
    posts
  };

  fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
  fs.writeFileSync(OUTFILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Saved ${posts.length} posts to ${OUTFILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

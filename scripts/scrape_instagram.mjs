/**
 * Scrape latest Instagram post URLs from a public profile.
 * This runs in GitHub Actions using Playwright (Chromium).
 *
 * Notes for collaborators:
 * - This is best-effort. Instagram can change HTML and block automation.
 * - If it breaks, check the GitHub Actions logs.
 */

import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const PROFILE = "https://www.instagram.com/newyorkromaniangroup/";
const OUTFILE = path.join(process.cwd(), "assets", "instagram.json");
const LIMIT = 3;

function uniqueInOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
  });

  await page.goto(PROFILE, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Try to click cookie accept if it appears.
  // This selector can vary, so keep this defensive.
  try {
    const cookieButton = page.getByRole("button", { name: /allow all|accept all|accept/i });
    if (await cookieButton.isVisible({ timeout: 4000 })) await cookieButton.click();
  } catch {}

  // Give the grid a moment to load.
  await page.waitForTimeout(4000);

  // Grab post links that look like /p/... or /reel/...
  const hrefs = await page.$$eval("a", (as) =>
    as.map((a) => a.getAttribute("href")).filter(Boolean)
  );

  const postUrls = uniqueInOrder(
    hrefs
      .filter((h) => h.startsWith("/p/") || h.startsWith("/reel/"))
      .map((h) => new URL(h, "https://www.instagram.com").toString())
  ).slice(0, LIMIT);

  const payload = {
    updated_at: new Date().toISOString(),
    posts: postUrls.map((url) => ({ url }))
  };

  fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
  fs.writeFileSync(OUTFILE, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Saved ${payload.posts.length} posts to ${OUTFILE}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

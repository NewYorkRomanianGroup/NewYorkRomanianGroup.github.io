import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const USERNAME = "newyorkromaniangroup";
const PROFILE = `https://www.instagram.com/${USERNAME}/`;
const OUTFILE = path.join(process.cwd(), "assets", "instagram.json");
const LIMIT = 3;

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) if (!seen.has(x)) (seen.add(x), out.push(x));
  return out;
}

function normalizeToCanonical(urlStr) {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split("/").filter(Boolean); // ["username","p","CODE"] or ["p","CODE"]

    if (parts.length >= 2) {
      const kind = parts[parts.length - 2];
      const code = parts[parts.length - 1];
      if (kind === "p" || kind === "reel") return `https://www.instagram.com/${kind}/${code}/`;
    }
  } catch {}
  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
  });

  await page.goto(PROFILE, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Give it time to populate the grid
  await page.waitForTimeout(4000);

  // Grab all anchors
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href).filter(Boolean));

  const postUrls = uniq(
    hrefs
      .map(normalizeToCanonical)
      .filter(Boolean)
  ).slice(0, LIMIT);

  // If blocked, do NOT overwrite existing file with empty posts
  if (postUrls.length < LIMIT) {
    console.log(`Found only ${postUrls.length} post URLs. Likely blocked on this runner. Leaving existing instagram.json unchanged.`);
    await browser.close();
    return;
  }

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
  // Do not hard-fail the workflow if you want it to be non-disruptive:
  // process.exit(0)
  process.exit(1);
});
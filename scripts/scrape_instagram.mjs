import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

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
    const parts = u.pathname.split("/").filter(Boolean);
    // Possible shapes:
    // ["p","CODE"]
    // ["reel","CODE"]
    // ["newyorkromaniangroup","p","CODE"]
    // ["newyorkromaniangroup","reel","CODE"]

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

  mkdirSync("scripts/_debug", { recursive: true });
  await page.screenshot({ path: "scripts/_debug/ig_profile.png", fullPage: true });
  const html = await page.content();
  writeFileSync("scripts/_debug/ig_profile.html", html, "utf8");
  console.log("[DEBUG] Saved scripts/_debug/ig_profile.png and ig_profile.html");


  // Grab all anchors
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href).filter(Boolean));
  console.log(`[DEBUG] Total anchors: ${hrefs.length}`);
  console.log("[DEBUG] First 60 hrefs:");
  hrefs.slice(0, 60).forEach((h) => console.log("  " + h));

  // Show any hrefs that look post-like even before normalization
  const rawCandidates = hrefs.filter((h) => /\/(p|reel)\//.test(h));
  console.log(`[DEBUG] Raw candidates containing /p/ or /reel/: ${rawCandidates.length}`);
  console.log("[DEBUG] First 30 raw candidates:");
  rawCandidates.slice(0, 30).forEach((h) => console.log("  " + h));

  const postUrls = uniq(
    hrefs
      .map(normalizeToCanonical)
      .filter(Boolean)
  ).slice(0, LIMIT);

  const normalized = hrefs.map(normalizeToCanonical).filter(Boolean);
  console.log(`[DEBUG] Normalized candidates: ${normalized.length}`);
  console.log("[DEBUG] First 30 normalized:");
  normalized.slice(0, 30).forEach((h) => console.log("  " + h));



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
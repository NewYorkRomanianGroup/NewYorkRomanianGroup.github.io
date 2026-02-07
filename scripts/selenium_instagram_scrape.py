#!/usr/bin/env python3
"""
NYRG Instagram scraper (headed Selenium).

Goal:
- Open the public profile page in a real Chrome window (headed)
- Extract the latest 3 post URLs
- Write them to assets/instagram.json in the repo
- Optionally commit + push via git (SSH) if changed

Notes:
- Instagram may block unauthenticated visitors, show login interstitials, or rate limit.
- If it fails, it exits without modifying your JSON.
- Headed mode first, headless later.
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


PROFILE_URL = "https://www.instagram.com/newyorkromaniangroup/"
LIMIT = 3

REPO_ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = REPO_ROOT / "assets" / "instagram.json"

POST_RE = re.compile(r"^/(p|reel)/[^/]+/?$")


def run(cmd, cwd=None):
    return subprocess.run(cmd, cwd=cwd, check=False, text=True, capture_output=True)


def safe_write_json(path: Path, payload: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def try_click(driver, by, value, timeout=2):
    try:
        el = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((by, value)))
        el.click()
        return True
    except Exception:
        return False


def collect_post_urls(driver) -> list[str]:
    """
    Collect post URLs from anchors on the profile page.
    We look for hrefs like /p/... or /reel/...
    """
    anchors = driver.find_elements(By.CSS_SELECTOR, "a[href]")
    hrefs = []
    for a in anchors:
        href = a.get_attribute("href")
        if not href:
            continue
        # Normalize to path if it is full URL
        # Example: https://www.instagram.com/p/XXXX/
        if href.startswith("https://www.instagram.com/"):
            path = href.replace("https://www.instagram.com", "")
        else:
            path = href

        if POST_RE.match(path):
            # Build absolute URL
            abs_url = "https://www.instagram.com" + path
            hrefs.append(abs_url)

    # De-dupe in order
    seen = set()
    out = []
    for u in hrefs:
        if u not in seen:
            seen.add(u)
            out.append(u)

    return out[:LIMIT]


def main():
    if not JSON_PATH.exists():
        safe_write_json(JSON_PATH, {"updated_at": None, "posts": []})

    opts = Options()

    # Headed mode (default). Keep it visible.
    # opts.add_argument("--headless=new")  # later if you want headless

    # Reduce noise
    opts.add_argument("--disable-notifications")
    opts.add_argument("--lang=en-US")

    # Slightly more "real browser" feel
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122 Safari/537.36"
    )

    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1200, 900)

    try:
        driver.get(PROFILE_URL)

        wait = WebDriverWait(driver, 15)

        # Cookie / consent popups vary a lot. Try a few common patterns.
        # These may do nothing, which is fine.
        try_click(driver, By.XPATH, "//button[contains(., 'Allow all')]", timeout=3)
        try_click(driver, By.XPATH, "//button[contains(., 'Accept all')]", timeout=3)
        try_click(driver, By.XPATH, "//button[contains(., 'Accept')]", timeout=2)

        # If Instagram shows a login modal overlay, sometimes there is an "X" button.
        # This is best-effort and may not exist.
        try_click(driver, By.CSS_SELECTOR, "svg[aria-label='Close']")

        # Wait until the page has anchors. If blocked, we will still have anchors, just not posts.
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href]")))

        # Give the page a moment to populate the grid
        time.sleep(3)

        urls = collect_post_urls(driver)

        if len(urls) < LIMIT:
            print(f"[NYRG] Found only {len(urls)} post URLs. Likely blocked or page did not load posts.")
            print("[NYRG] Not updating instagram.json.")
            return 0

        payload = {
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "posts": [{"url": u} for u in urls],
        }

        safe_write_json(JSON_PATH, payload)
        print(f"[NYRG] Wrote {len(urls)} URLs to {JSON_PATH}")

        return 0

    finally:
        # Leave the browser open for a couple seconds so you can see what happened.
        time.sleep(2)
        driver.quit()


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
NYRG Instagram scraper (Selenium).

Goal:
- Open the public profile page
- Extract the latest N post URLs (default 4)
- Write them to data/instagram.json
- If extraction fails (blocked, changed markup, rate limit), do NOT modify the JSON.

This file is heavily commented because collaborators may be new to coding.

How to run:
- From repo root:
    python3 scripts/selenium_instagram_scrape.py

Optional environment variables:
- NYRG_IG_PROFILE_URL   (default: NYRG profile)
- NYRG_IG_LIMIT         (default: 4)
- NYRG_IG_JSON_PATH     (default: data/instagram.json)
- NYRG_IG_HEADLESS      ("1" default, set to "0" to see the browser)
- NYRG_IG_DEBUG         ("0" default, set to "1" for extra logs + screenshots)
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_PROFILE_URL = "https://www.instagram.com/newyorkromaniangroup/"
DEFAULT_LIMIT = 4

REPO_ROOT = Path(__file__).resolve().parents[1]

# URL patterns for posts. Instagram post links often look like:
# - /p/<code>/
# - /reel/<code>/
# Sometimes links also appear as /<username>/p/<code>/, so we normalize.
POST_RE = r"^/(?:[^/]+/)?(p|reel)/[^/]+/?$"


def env_str(name: str, default: str) -> str:
    v = os.environ.get(name)
    return default if v is None or v.strip() == "" else v.strip()


def env_int(name: str, default: int) -> int:
    v = os.environ.get(name)
    if v is None or v.strip() == "":
        return default
    try:
        return int(v)
    except ValueError:
        return default


def env_bool(name: str, default: bool) -> bool:
    v = os.environ.get(name)
    if v is None:
        return default
    return v.strip() in ("1", "true", "True", "yes", "YES")


def safe_write_json(path: Path, payload: dict) -> None:
    """
    Write JSON atomically:
    - write to a .tmp file
    - replace the destination
    This avoids partially-written files if the script crashes.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def debug_screenshot(driver, path: Path, debug: bool, label: str) -> None:
    if not debug:
        return
    try:
        driver.save_screenshot(str(path))
        print(f"[NYRG][DEBUG] Saved screenshot ({label}): {path}")
    except Exception as e:
        print(f"[NYRG][DEBUG] Screenshot failed ({label}): {e}")


def collect_post_urls(driver, limit: int, debug: bool) -> list:
    """
    Collect candidate post URLs by scanning all anchors on the page.
    Then normalize to canonical URLs: https://www.instagram.com/p/<code>/
    """
    anchors = driver.find_elements(By.CSS_SELECTOR, "a[href]")
    found = []

    for a in anchors:
        href = a.get_attribute("href")
        if not href:
            continue

        parsed = urlparse(href)
        path = parsed.path  # ignore query and fragment

        if not __import__("re").match(POST_RE, path):
            continue

        # Normalize:
        # - If path is /<username>/p/<code>/ convert to /p/<code>/
        parts = [p for p in path.split("/") if p]  # remove empty
        if len(parts) >= 2 and parts[-2] in ("p", "reel"):
            kind = parts[-2]
            code = parts[-1]
            found.append(f"https://www.instagram.com/{kind}/{code}/")

    # De-dupe in order
    out = []
    seen = set()
    for u in found:
        if u not in seen:
            seen.add(u)
            out.append(u)

    if debug:
        print(f"[NYRG][DEBUG] Found {len(out)} unique post-like URLs (pre-limit).")

    return out[:limit]


def build_driver(headless: bool) -> webdriver.Chrome:
    opts = Options()

    # If you ever need to log in manually, a persistent user data dir can help.
    # This can also create surprises if the stored profile gets stale.
    # Keep it, but make sure the folder is not inside the repo.
    opts.add_argument(f"--user-data-dir={os.path.expanduser('~/.config/google-chrome-selenium')}")
    opts.add_argument("--profile-directory=Default")

    # Headless is default for automation. Set NYRG_IG_HEADLESS=0 to see the browser.
    if headless:
        opts.add_argument("--headless=new")

    # Reduce noise and popups
    opts.add_argument("--disable-notifications")
    opts.add_argument("--lang=en-US")

    # Slightly more "real browser" feel (may help in some cases)
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122 Safari/537.36"
    )

    # Linux stability flags
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1200,900")

    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1200, 900)
    return driver


def try_click(driver, by, value, timeout: int = 2) -> bool:
    """
    Best-effort click helper for cookie banners / overlays.
    It is fine if this does nothing.
    """
    try:
        el = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((by, value)))
        el.click()
        return True
    except Exception:
        return False


def main() -> int:
    profile_url = env_str("NYRG_IG_PROFILE_URL", DEFAULT_PROFILE_URL)
    limit = max(1, env_int("NYRG_IG_LIMIT", DEFAULT_LIMIT))
    json_path = Path(env_str("NYRG_IG_JSON_PATH", str(REPO_ROOT / "data" / "instagram.json")))
    headless = env_bool("NYRG_IG_HEADLESS", True)
    debug = env_bool("NYRG_IG_DEBUG", False)

    # Do not create or overwrite JSON on startup. Only write after success.
    if debug:
        print("[NYRG][DEBUG] profile_url:", profile_url)
        print("[NYRG][DEBUG] limit:", limit)
        print("[NYRG][DEBUG] json_path:", json_path)
        print("[NYRG][DEBUG] headless:", headless)

    driver = build_driver(headless=headless)

    try:
        driver.get(profile_url)

        # If IG shows a login page, we cannot scrape reliably without auth.
        # In headed mode, you might log in manually. In headless mode, treat as blocked.
        if "accounts/login" in driver.current_url:
            if headless:
                print("[NYRG] Login wall detected in headless mode. Not updating JSON.")
                return 0
            print("[NYRG] Login page detected. Log in manually in the browser window.")
            print("[NYRG] After logging in, leave the window open for ~60 seconds.")
            time.sleep(60)

        if debug:
            print("[NYRG][DEBUG] Current URL:", driver.current_url)
            print("[NYRG][DEBUG] Title:", driver.title)

        debug_screenshot(driver, REPO_ROOT / "scripts" / "debug_instagram.png", debug, "initial")

        wait = WebDriverWait(driver, 15)

        # Cookie / consent popups vary. Best-effort.
        try_click(driver, By.XPATH, "//button[contains(., 'Allow all')]", timeout=3)
        try_click(driver, By.XPATH, "//button[contains(., 'Accept all')]", timeout=3)
        try_click(driver, By.XPATH, "//button[contains(., 'Accept')]", timeout=2)

        # Sometimes there is a close button on overlays
        try_click(driver, By.CSS_SELECTOR, "svg[aria-label='Close']", timeout=2)

        # Wait until anchors exist. Even blocked pages have anchors, but this prevents early scraping.
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href]")))

        urls = []

        # Scroll a few times to encourage the grid to load.
        for i in range(5):
            time.sleep(2)
            urls = collect_post_urls(driver, limit=limit, debug=debug)
            print(f"[NYRG] Pass {i + 1}: found {len(urls)} post URLs")
            if len(urls) >= limit:
                break
            driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)

        debug_screenshot(driver, REPO_ROOT / "scripts" / "debug_instagram_after_scroll.png", debug, "after_scroll")

        # If we did not find enough URLs, do not update JSON.
        if len(urls) < limit:
            print(f"[NYRG] Found only {len(urls)} post URLs. Likely blocked or page did not load posts.")
            print("[NYRG] Not updating instagram.json.")
            return 0

        payload = {
            "source": profile_url,
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "count": len(urls),
            "posts": [{"url": u} for u in urls],
        }

        safe_write_json(json_path, payload)
        print(f"[NYRG] Wrote {len(urls)} URLs to {json_path}")
        return 0

    finally:
        # Keep this short. If you want to watch the browser, set NYRG_IG_HEADLESS=0.
        time.sleep(1)
        driver.quit()


if __name__ == "__main__":
    sys.exit(main())

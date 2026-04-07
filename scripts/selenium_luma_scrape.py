#!/usr/bin/env python3
"""
NYRG Luma scraper (Selenium).

Goal:
- Open the public Luma calendar page (lu.ma/nyrg)
- Extract upcoming event URLs and titles
- Write them to data/luma.json
- If extraction fails, do NOT modify the JSON.

How to run:
- From repo root:
    python3 scripts/selenium_luma_scrape.py

Optional environment variables:
- NYRG_LUMA_URL        (default: https://lu.ma/nyrg)
- NYRG_LUMA_JSON_PATH  (default: data/luma.json)
- NYRG_LUMA_HEADLESS   ("1" default, set to "0" to see the browser)
- NYRG_LUMA_DEBUG      ("0" default, set to "1" for extra logs + screenshots)
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_LUMA_URL = "https://lu.ma/nyrg"

REPO_ROOT = Path(__file__).resolve().parents[1]

# Luma event URLs look like: https://lu.ma/abc123 or https://lu.ma/event/evt-xxx
LUMA_EVENT_RE = re.compile(r"^https://lu\.ma/(?:event/[^/?#]+|[a-zA-Z0-9_-]+)$")


def env_str(name: str, default: str) -> str:
    v = os.environ.get(name)
    return default if v is None or v.strip() == "" else v.strip()


def env_bool(name: str, default: bool) -> bool:
    v = os.environ.get(name)
    if v is None:
        return default
    return v.strip() in ("1", "true", "True", "yes", "YES")


def safe_write_json(path: Path, payload: dict) -> None:
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


def build_driver(headless: bool) -> webdriver.Chrome:
    opts = Options()
    opts.add_argument(f"--user-data-dir={os.path.expanduser('~/.config/google-chrome-selenium-luma')}")
    opts.add_argument("--profile-directory=Default")

    if headless:
        opts.add_argument("--headless=new")

    opts.add_argument("--disable-notifications")
    opts.add_argument("--lang=en-US")
    opts.add_argument(
        "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122 Safari/537.36"
    )
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1200,900")

    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1200, 900)
    return driver


def collect_event_urls(driver, debug: bool) -> list:
    """
    Collect upcoming event URLs and titles from the Luma calendar page.
    Returns a list of dicts: [{"url": ..., "title": ...}, ...]
    """
    anchors = driver.find_elements(By.CSS_SELECTOR, "a[href]")
    found = []
    seen = set()

    for a in anchors:
        href = a.get_attribute("href") or ""
        href = href.split("?")[0].rstrip("/")

        # Skip the calendar page itself and non-event links
        if not href or href == DEFAULT_LUMA_URL.rstrip("/"):
            continue
        if not LUMA_EVENT_RE.match(href):
            continue
        if href in seen:
            continue

        seen.add(href)

        # Best-effort title extraction from the anchor text or a child element
        try:
            title = a.text.strip().split("\n")[0].strip()
        except Exception:
            title = ""

        if not title:
            title = href.split("/")[-1]

        found.append({"url": href, "title": title})

    if debug:
        print(f"[NYRG][DEBUG] Found {len(found)} event URLs.")

    return found


def main() -> int:
    luma_url = env_str("NYRG_LUMA_URL", DEFAULT_LUMA_URL)
    json_path = Path(env_str("NYRG_LUMA_JSON_PATH", str(REPO_ROOT / "data" / "luma.json")))
    headless = env_bool("NYRG_LUMA_HEADLESS", True)
    debug = env_bool("NYRG_LUMA_DEBUG", False)

    if debug:
        print("[NYRG][DEBUG] luma_url:", luma_url)
        print("[NYRG][DEBUG] json_path:", json_path)
        print("[NYRG][DEBUG] headless:", headless)

    driver = build_driver(headless=headless)

    try:
        driver.get(luma_url)

        if debug:
            print("[NYRG][DEBUG] Current URL:", driver.current_url)
            print("[NYRG][DEBUG] Title:", driver.title)

        debug_screenshot(driver, REPO_ROOT / "scripts" / "debug_luma.png", debug, "initial")

        wait = WebDriverWait(driver, 15)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href]")))

        events = []

        # Scroll a few times to encourage all events to load
        for i in range(4):
            time.sleep(2)
            events = collect_event_urls(driver, debug=debug)
            print(f"[NYRG] Pass {i + 1}: found {len(events)} event URLs")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

        debug_screenshot(driver, REPO_ROOT / "scripts" / "debug_luma_after_scroll.png", debug, "after_scroll")

        if len(events) == 0:
            print("[NYRG] Found 0 events. Page may not have loaded correctly.")
            print("[NYRG] Not updating luma.json.")
            return 0

        payload = {
            "_comment": "THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.",
            "source": luma_url,
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "count": len(events),
            "events": events,
        }

        safe_write_json(json_path, payload)
        print(f"[NYRG] Wrote {len(events)} events to {json_path}")
        return 0

    finally:
        time.sleep(1)
        driver.quit()


if __name__ == "__main__":
    sys.exit(main())

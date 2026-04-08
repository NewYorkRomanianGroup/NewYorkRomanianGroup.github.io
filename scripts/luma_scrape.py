#!/usr/bin/env python3
"""
NYRG Luma scraper.

Goal:
- Fetch upcoming events from the Luma calendar API
- Write them to data/luma.json
- If the request fails, do NOT modify the JSON.

How to run:
- From repo root:
    python3 scripts/selenium_luma_scrape.py

Optional environment variables:
- NYRG_LUMA_JSON_PATH  (default: data/luma.json)
- NYRG_LUMA_DEBUG      ("0" default, set to "1" for extra logs)
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

CALENDAR_API_ID = "cal-qOrYkgFc93AqbB1"
API_URL = (
    f"https://api2.luma.com/calendar/get-items"
    f"?calendar_api_id={CALENDAR_API_ID}&pagination_limit=20&period=future"
)
LUMA_BASE_URL = "https://lu.ma"

REPO_ROOT = Path(__file__).resolve().parents[1]


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


def main() -> int:
    json_path = Path(env_str("NYRG_LUMA_JSON_PATH", str(REPO_ROOT / "data" / "luma.json")))
    debug = env_bool("NYRG_LUMA_DEBUG", False)

    if debug:
        print("[NYRG][DEBUG] api_url:", API_URL)
        print("[NYRG][DEBUG] json_path:", json_path)

    try:
        res = requests.get(API_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)

        if not res.ok:
            print(f"[NYRG] API returned {res.status_code}. Not updating luma.json.")
            return 0

        data = res.json()
        entries = data.get("entries", [])

        if debug:
            print(f"[NYRG][DEBUG] Raw entries: {json.dumps(entries, indent=2)}")

        events = []
        for entry in entries:
            event = entry.get("event", {})
            name = event.get("name", "").strip()
            url_slug = event.get("url", "").strip()
            api_id = event.get("api_id", "").strip()
            start_at = event.get("start_at", "")
            cover_url = event.get("cover_url", "")
            geo = event.get("geo_address_info", {}) or {}

            if url_slug:
                url = f"{LUMA_BASE_URL}/{url_slug}"
            elif api_id:
                url = f"{LUMA_BASE_URL}/event/{api_id}"
            else:
                continue

            events.append({
                "title": name,
                "url": url,
                "start_at": start_at,
                "cover_url": cover_url,
                "geo_address_info": {
                    "address": geo.get("address", ""),
                    "short_address": geo.get("short_address", ""),
                    "full_address": geo.get("full_address", ""),
                    "city": geo.get("city", ""),
                },
            })

        print(f"[NYRG] Found {len(events)} upcoming event(s).")

        if len(events) == 0:
            print("[NYRG] No upcoming events. Writing empty luma.json.")

        payload = {
            "_comment": "THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.",
            "source": f"{LUMA_BASE_URL}/nyrg",
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "count": len(events),
            "events": events,
        }

        safe_write_json(json_path, payload)
        print(f"[NYRG] Wrote {len(events)} event(s) to {json_path}")
        return 0

    except Exception as e:
        print(f"[NYRG] Error fetching Luma events: {e}")
        print("[NYRG] Not updating luma.json.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
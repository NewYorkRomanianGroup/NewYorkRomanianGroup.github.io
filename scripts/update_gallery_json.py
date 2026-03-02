#!/usr/bin/env python3
"""
Update data/gallery.json with:
- A flat list of images for the homepage rotator (backward compatible with current site.js)
- A structured "events" list for the Gallery page (Drive folders + external events from a Google Sheet)

Usage:
  GOOGLE_API_KEY="..." python3 update_gallery_json.py \
    --folder-id "YOUR_FOLDER_ID" \
    --out "data/gallery.json"

Optional external events (Google Sheet published as CSV):
  export NYRG_EXTERNAL_EVENTS_CSV_URL="https://...output=csv"
or:
  python3 update_gallery_json.py ... --external-events-csv "https://...output=csv"

Notes:
- Uses Google Drive v3 REST API via an API key.
- Works for publicly accessible folders/files.
- This file is intentionally heavily commented for collaborators.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime, timezone
from io import StringIO
from typing import List, Optional, Tuple

import requests


DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files"

# High caps are fine for you right now (few folders, ~10-20 images per folder).
MAX_IMAGES_PER_EVENT = 200
MAX_EVENTS_FROM_DRIVE = 50

# Exclusion rule: anything starting with this prefix is not included on the website.
EXCLUDE_PREFIXES = ["(not for website)"]


def iso_utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def drive_list_children(
    api_key: str,
    parent_id: str,
    page_token: str | None = None,
) -> Tuple[List[dict], str | None]:
    """
    List direct children of a Drive folder.
    Returns (files, nextPageToken).

    Important:
    - We intentionally avoid supportsAllDrives/includeItemsFromAllDrives here because
      those params can trigger hard 400s in some setups when using API-key access.
    - If you later need Shared Drive support, we can add an opt-in switch.
    """
    params = {
        "key": api_key,
        "q": f"'{parent_id}' in parents and trashed=false",
        "fields": "nextPageToken, files(id, name, mimeType, webViewLink, shortcutDetails(targetId,targetMimeType))",
        "pageSize": 1000,
    }
    if page_token:
        params["pageToken"] = page_token

    r = requests.get(DRIVE_FILES_ENDPOINT, params=params, timeout=30)

    # If Google returns a helpful JSON error, print it.
    if r.status_code >= 400:
        try:
            print(f"[NYRG] Drive API error {r.status_code}: {r.json()}", file=sys.stderr)
        except Exception:
            print(f"[NYRG] Drive API error {r.status_code}: {r.text}", file=sys.stderr)

    r.raise_for_status()
    data = r.json()
    return data.get("files", []), data.get("nextPageToken")

def is_excluded_folder(name: str) -> bool:
    n = (name or "").strip().lower()
    return any(n.startswith(p.lower()) for p in EXCLUDE_PREFIXES)


def drive_folder_url(folder_id: str) -> str:
    return f"https://drive.google.com/drive/folders/{folder_id}"


def prettify_title(folder_name: str) -> str:
    """Make folder names nicer for display without needing a GitHub edit."""
    s = (folder_name or "").strip()
    s = re.sub(r"^\s*NYRG\s+", "", s, flags=re.IGNORECASE)
    s = s.replace("_", " ").replace(".", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


_MONTHS = {
    "jan": "01", "january": "01",
    "feb": "02", "february": "02",
    "mar": "03", "march": "03",
    "apr": "04", "april": "04",
    "may": "05",
    "jun": "06", "june": "06",
    "jul": "07", "july": "07",
    "aug": "08", "august": "08",
    "sep": "09", "sept": "09", "september": "09",
    "oct": "10", "october": "10",
    "nov": "11", "november": "11",
    "dec": "12", "december": "12",
}


def parse_month_from_name(name: str) -> Optional[str]:
    """Parse month-level YYYY-MM from a folder name (best-effort)."""
    raw = (name or "").strip().lower()
    raw = raw.replace("_", " ").replace(".", " ").replace("-", " ")
    raw = re.sub(r"\s+", " ", raw)

    # Pattern A: MMM YYYY (e.g., "jan 2026")
    m = re.search(r"\b([a-z]{3,9})\s+(\d{4})\b", raw)
    if m:
        mon = _MONTHS.get(m.group(1))
        yr = m.group(2)
        if mon:
            return f"{yr}-{mon}"

    # Pattern B: MMMYYYY (e.g., "dec2025")
    m = re.search(r"\b([a-z]{3,9})(\d{4})\b", raw)
    if m:
        mon = _MONTHS.get(m.group(1))
        yr = m.group(2)
        if mon:
            return f"{yr}-{mon}"

    # Pattern C: YYYY MMM (rare)
    m = re.search(r"\b(\d{4})\s+([a-z]{3,9})\b", raw)
    if m:
        yr = m.group(1)
        mon = _MONTHS.get(m.group(2))
        if mon:
            return f"{yr}-{mon}"

    return None


def drive_thumbnail_url(file_id: str) -> str:
    return f"https://drive.google.com/thumbnail?id={file_id}&sz=w2000"


def walk_drive_folder_collect_images(
    api_key: str,
    root_folder_id: str,
    max_images: int,
) -> List[dict]:
    """Recursively walk a Drive folder and collect up to max_images image files."""
    stack = [root_folder_id]
    seen_folders = set()
    images: List[dict] = []

    while stack and len(images) < max_images:
        folder_id = stack.pop()
        if folder_id in seen_folders:
            continue
        seen_folders.add(folder_id)
        token = None

        while True:
            files, token = drive_list_children(api_key, folder_id, token)

            for f in files:
                mime = f.get("mimeType", "")

                # ---------------------------------------------
                # Shortcut handling (folders or images)
                # ---------------------------------------------
                if mime == "application/vnd.google-apps.shortcut":
                    sd = f.get("shortcutDetails") or {}
                    target_id = sd.get("targetId", "")
                    target_mime = sd.get("targetMimeType", "")

                    # Shortcut -> folder: traverse it
                    if target_mime == "application/vnd.google-apps.folder" and target_id:
                        stack.append(target_id)
                        continue

                    # Shortcut -> image: include it
                    if target_mime.startswith("image/") and target_id:
                        images.append({
                            "id": target_id,
                             "name": f.get("name", "") or f.get("shortcutDetails", {}).get("targetId", ""),
                            "mimeType": target_mime,
                            "url": drive_thumbnail_url(target_id),
                            "webViewLink": f.get("webViewLink", ""),
                        })
                        if len(images) >= max_images:
                            break
                        continue

                    # Shortcut to something else: ignore
                    continue

                # Normal folder: traverse it
                if mime == "application/vnd.google-apps.folder":
                    stack.append(f["id"])
                    continue

                # Normal image file: include it
                if mime.startswith("image/"):
                    file_id = f["id"]
                    images.append({
                        "id": file_id,
                        "name": f.get("name", ""),
                        "mimeType": mime,
                        "url": drive_thumbnail_url(file_id),
                        "webViewLink": f.get("webViewLink", ""),
                    })

                    if len(images) >= max_images:
                        break

            if not token or len(images) >= max_images:
                break

    images.sort(key=lambda x: (x.get("name", "") or "").lower())
    return images

def list_drive_event_folders(api_key: str, root_folder_id: str) -> List[dict]:
    """List top-level subfolders under the root folder and apply exclusions."""
    token = None
    out: List[dict] = []

    while True:
        files, token = drive_list_children(api_key, root_folder_id, token)
        for f in files:
            mime = f.get("mimeType", "")
            name = f.get("name", "")

            # A) Normal folder
            if mime == "application/vnd.google-apps.folder":
                if is_excluded_folder(name):
                    continue
                out.append(f)
                continue

            # B) Shortcut that points to a folder
            if mime == "application/vnd.google-apps.shortcut":
                sd = f.get("shortcutDetails") or {}
                if sd.get("targetMimeType") == "application/vnd.google-apps.folder":
                    if is_excluded_folder(name):
                        continue
                    out.append({
                        "id": sd.get("targetId"),      # this is the REAL folder id
                        "name": name,                  # keep the display name (NYRG Dec2025)
                        "mimeType": "application/vnd.google-apps.folder",
                        # "webViewLink": drive_folder_url(sd.get("targetId","")),
                    })

        if not token:
            break

    out.sort(key=lambda x: (x.get("name", "") or "").lower())
    return out[:MAX_EVENTS_FROM_DRIVE]


def fetch_external_events_from_csv(csv_url: str) -> List[dict]:
    """Fetch external events from a Google Sheet published as CSV."""
    if not csv_url:
        return []

    r = requests.get(csv_url, timeout=30, allow_redirects=True)
    r.raise_for_status()

    buf = StringIO(r.text)
    reader = csv.DictReader(buf)

    events: List[dict] = []
    for i, row in enumerate(reader):
        row_lc = {(k or "").strip().lower(): (v or "").strip() for k, v in (row or {}).items()}

        month = row_lc.get("month", "") or row_lc.get("date", "")
        title = row_lc.get("title", "")
        url = row_lc.get("url", "")

        if not month or not title or not url:
            continue

        # allow YYYY-MM-DD and truncate to YYYY-MM
        if re.match(r"^\d{4}-\d{2}-\d{2}$", month):
            month = month[:7]

        if not re.match(r"^\d{4}-\d{2}$", month):
            continue

        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        events.append({
            "type": "external",
            "id": f"external:{slug or i}",
            "month": month,
            "title": title,
            "url": url,
            "thumb_url": row_lc.get("thumb_url", ""),
            "photographer": row_lc.get("photographer", ""),
            "note": row_lc.get("note", ""),
        })

    return events


def month_sort_key(month: str) -> str:
    if re.match(r"^\d{4}-\d{2}$", month or ""):
        return month
    return "0000-00"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder-id", required=True, help="Google Drive root folder ID")
    ap.add_argument("--out", default="data/gallery.json", help="Output JSON path")
    ap.add_argument(
        "--external-events-csv",
        default="",
        help=(
            "Optional CSV URL for external events (Google Sheet published as CSV). "
            "If not set, uses NYRG_EXTERNAL_EVENTS_CSV_URL env var."
        ),
    )
    args = ap.parse_args()

    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GOOGLE_API_KEY is not set.", file=sys.stderr)
        return 2

    external_csv = (args.external_events_csv or os.environ.get("NYRG_EXTERNAL_EVENTS_CSV_URL", "")).strip()

    # 1) Internal Drive events: each top-level folder is an event.
    folders = list_drive_event_folders(api_key, args.folder_id)
    drive_events: List[dict] = []

    for f in folders:
        folder_id = f["id"]
        folder_name = f.get("name", "")
        month = parse_month_from_name(folder_name) or "0000-00"

        images = walk_drive_folder_collect_images(api_key, folder_id, MAX_IMAGES_PER_EVENT)

        drive_events.append({
            "type": "drive",
            "id": folder_id,
            "month": month,
            "title": prettify_title(folder_name) or folder_name,
            "folder_url": drive_folder_url(folder_id),
            "photographer": "",
            "note": "",
            "images": images,
        })

    # 2) External events from Google Sheet (published as CSV)
    external_events: List[dict] = []
    if external_csv:
        try:
            external_events = fetch_external_events_from_csv(external_csv)
        except Exception as e:
            print(f"[NYRG] WARNING: failed to fetch external events CSV: {e}", file=sys.stderr)
            external_events = []

    # 3) Merge and sort events by month desc
    all_events = drive_events + external_events
    all_events.sort(key=lambda ev: month_sort_key(ev.get("month", "")), reverse=True)

    # 4) Backward-compatible flat images array for the homepage rotator
    flat_images: List[dict] = []
    for ev in all_events:
        if ev.get("type") != "drive":
            continue
        for img in ev.get("images", [])[:MAX_IMAGES_PER_EVENT]:
            flat_images.append(img)

    flat_images.sort(key=lambda x: (x.get("name", "") or "").lower())

    payload = {
        "updated_at": iso_utc_now(),
        "folder_id": args.folder_id,
        "root_folder": {"id": args.folder_id, "url": drive_folder_url(args.folder_id)},
        "count": len(flat_images),
        "images": flat_images,
        "events": all_events,
        "external_events_csv": external_csv,
    }

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(flat_images)} images and {len(all_events)} events -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

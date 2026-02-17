#!/usr/bin/env python3
"""
Update data/gallery.json with image files from a Google Drive folder, recursively.

Usage:
  GOOGLE_API_KEY="..." python3 scripts/update_gallery_json.py \
    --folder-id "YOUR_FOLDER_ID" \
    --out "data/gallery.json"

Notes:
- This uses the Google Drive v3 REST API via an API key.
- It works for publicly accessible folders/files. If your folder is not public, the API key
  will not be enough. In that case you would switch to OAuth or a service account.
- We keep this script heavily commented for collaborators.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Tuple

import requests


DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files"


def iso_utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def drive_list_children(api_key: str, parent_id: str, page_token: str | None = None) -> Tuple[List[dict], str | None]:
    """
    List direct children of a Drive folder.
    Returns (files, nextPageToken).
    """
    params = {
        "key": api_key,
        # Query: items whose parent is the folder, and not trashed
        "q": f"'{parent_id}' in parents and trashed=false",
        # We need mimeType to detect folders vs images
        "fields": "nextPageToken, files(id, name, mimeType, webViewLink)",
        # Public drives sometimes include shortcuts. Keep it simple for now.
        "pageSize": 1000,
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true",
    }
    if page_token:
        params["pageToken"] = page_token

    r = requests.get(DRIVE_FILES_ENDPOINT, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    return data.get("files", []), data.get("nextPageToken")


def walk_drive_folder(api_key: str, root_folder_id: str) -> List[dict]:
    """
    Recursively walk Drive folder, collecting image files.
    """
    stack = [root_folder_id]
    images: List[dict] = []

    while stack:
        folder_id = stack.pop()

        token = None
        while True:
            files, token = drive_list_children(api_key, folder_id, token)

            for f in files:
                mime = f.get("mimeType", "")
                if mime == "application/vnd.google-apps.folder":
                    stack.append(f["id"])
                    continue

                # Keep only image files
                if mime.startswith("image/"):
                    file_id = f["id"]
                    name = f.get("name", "")
                    web = f.get("webViewLink", "")

                    # Direct-view URL that works well in <img> tags for public files
                    view_url = f"https://drive.google.com/uc?export=view&id={file_id}"

                    images.append({
                        "id": file_id,
                        "name": name,
                        "mimeType": mime,
                        "url": view_url,
                        "webViewLink": web
                    })

            if not token:
                break

    return images


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder-id", required=True, help="Google Drive folder ID")
    ap.add_argument("--out", default="data/gallery.json", help="Output JSON path")
    args = ap.parse_args()

    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GOOGLE_API_KEY is not set.", file=sys.stderr)
        print("Set it like: GOOGLE_API_KEY='...' python3 scripts/update_gallery_json.py --folder-id ...", file=sys.stderr)
        return 2

    images = walk_drive_folder(api_key, args.folder_id)

    payload = {
        "updated_at": iso_utc_now(),
        "folder_id": args.folder_id,
        "count": len(images),
        "images": sorted(images, key=lambda x: x.get("name", "").lower())
    }

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(images)} images -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

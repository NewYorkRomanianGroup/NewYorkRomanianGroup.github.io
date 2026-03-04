import csv
import json
import os
from datetime import datetime, timezone
import urllib.request
import re

CSV_URL = os.environ.get("NYRG_JOBS_CSV_URL")
OUTPUT_PATH = "data/jobs.json"

TODAY = datetime.now(timezone.utc).date()

TRUTHY = {"1", "true", "yes", "y", "on", "open"}

# -----------------------------------------------------
# Helper: normalize header text
# -----------------------------------------------------

def norm(s):
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())


# -----------------------------------------------------
# Helper: fuzzy column finder
# -----------------------------------------------------

def find_col(headers, *keywords):

    nheaders = {norm(h): h for h in headers}

    for key in keywords:
        nk = norm(key)

        for nh, original in nheaders.items():
            if nk in nh:
                return original

    return None


# -----------------------------------------------------
# Parse date
# -----------------------------------------------------

def parse_date(s):
    if not s:
        return None

    s = s.strip()

    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except:
            pass

    return None


# -----------------------------------------------------
# Truthy check
# -----------------------------------------------------

def is_truthy(v):
    if not v:
        return False
    return str(v).strip().lower() in TRUTHY


# -----------------------------------------------------
# Main
# -----------------------------------------------------

def main():

    if not CSV_URL:
        raise RuntimeError("NYRG_JOBS_CSV_URL not set")

    print("Downloading sheet...")

    with urllib.request.urlopen(CSV_URL) as r:
        lines = r.read().decode("utf-8").splitlines()

    reader = csv.DictReader(lines)

    headers = reader.fieldnames

    title_col = find_col(headers, "title", "position")
    company_col = find_col(headers, "company", "person", "employer")
    desc_col = find_col(headers, "description", "details")
    location_col = find_col(headers, "location")
    apply_col = find_col(headers, "apply", "url", "email", "link")
    deadline_col = find_col(headers, "deadline")
    show_col = find_col(headers, "show", "open")
    notes_col = find_col(headers, "note")

    print("Detected columns:")
    print("title:", title_col)
    print("company:", company_col)
    print("description:", desc_col)
    print("location:", location_col)
    print("apply:", apply_col)
    print("deadline:", deadline_col)
    print("show:", show_col)
    print("notes:", notes_col)

    jobs = []

    for row in reader:

        deadline_raw = (row.get(deadline_col) or "").strip() if deadline_col else ""
        open_flag = (row.get(show_col) or "").strip() if show_col else ""

        deadline = parse_date(deadline_raw)

        show = True

        if deadline:
            if deadline < TODAY:
                show = False
        else:
            if not is_truthy(open_flag):
                show = False

        if not show:
            continue

        jobs.append({
            "title": row.get(title_col, ""),
            "company": row.get(company_col, ""),
            "description": row.get(desc_col, ""),
            "location": row.get(location_col, ""),
            "apply_url": row.get(apply_col, ""),
            "deadline": deadline_raw,
            "deadline_iso": deadline.strftime("%Y-%m-%d") if deadline else "",
            "note": row.get(notes_col, "")
        })

    os.makedirs("data", exist_ok=True)

    with open(OUTPUT_PATH, "w") as f:
        json.dump({"jobs": jobs}, f, indent=2)

    print(f"Saved {len(jobs)} jobs → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
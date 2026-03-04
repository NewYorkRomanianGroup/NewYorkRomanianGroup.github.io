# Scripts overview

This repo uses a small set of scripts to generate JSON files that the website reads at runtime.

If you are only editing page text or CSS, you can ignore this folder.

## What each script does

### Instagram
- `scripts/selenium_instagram_scrape.py`
  - Scrapes the latest Instagram post URLs and writes `data/instagram.json`.
  - Designed to NOT overwrite JSON if scraping fails (login wall, blocked, markup change).

- `scripts/manual_test_instagram_update.sh`
  - Runs the scraper and shows a diff.
  - Does not commit or push.

- `scripts/daily_instagram_update.sh`
  - Runs the scraper, commits `data/instagram.json` if changed, pushes to `origin/main`.

### Gallery
- `scripts/update_gallery_json.py`
  - Uses Google Drive API (key-based) to generate `data/gallery.json`.
  - Supports optional external events from a published CSV.

- `scripts/update_gallery_json.sh`
  - Thin wrapper around the Python generator.

- `scripts/update_gallery_daily.sh`
  - Systemd-friendly wrapper: runs the generator, commits if changed, pushes on main.

### Jobs
- `scripts/update_jobs_json.py`
  - Downloads a published CSV (from the curated "For Show" tab) and writes `data/jobs.json`.

- `scripts/manual_test_jobs_update.sh`
  - Runs the jobs generator and shows a diff.
  - Does not commit or push.

- `scripts/update_jobs_daily.sh`
  - Systemd-friendly wrapper: runs the generator, commits if changed, pushes on main.

## Environment variables

Maintainers often store env vars in: `~/.config/nyrg/nyrg.env`

Common variables:
- `NYRG_JOBS_CSV_URL`
- `GOOGLE_API_KEY`
- `NYRG_GDRIVE_FOLDER_ID`
- `NYRG_EXTERNAL_EVENTS_CSV_URL` (optional)
- Instagram options (optional): `NYRG_IG_LIMIT`, `NYRG_IG_HEADLESS`, etc.

## Related maintainer docs

- `docs/automation-systemd.md`
- `docs/jobs-pipeline.md`

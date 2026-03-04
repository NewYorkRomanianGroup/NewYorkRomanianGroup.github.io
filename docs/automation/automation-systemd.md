# NYRG Automation Notes (systemd user timers)

This document describes one optional maintainer setup for keeping `data/*.json` fresh.

Not every collaborator needs this. If you only edit page text or CSS, you can ignore this file.

## What gets updated

- `data/instagram.json` is refreshed by Instagram scraping scripts.
- `data/gallery.json` is refreshed from a Google Drive folder.
- `data/jobs.json` is refreshed from a Google Sheet.

## Where the maintainer keeps systemd units

Example paths (Linux):
- User services and timers: `~/.config/systemd/user/`
- Environment variables: `~/.config/nyrg/nyrg.env`

## Common commands

- Reload unit files:
  `systemctl --user daemon-reload`

- Enable and start a timer:
  `systemctl --user enable --now <timer>.timer`

- Run a service immediately:
  `systemctl --user start <service>.service`

- View logs:
  `journalctl --user -u <service>.service -n 200 --no-pager`

## Notes for new maintainers

- Keep secrets (API keys, cookies) out of the repo. Use the env file.
- If you change any script paths, update the unit files accordingly.
- Always test scripts manually before scheduling them.

## Jobs sheet Apps Script dependency

The Jobs pipeline is not purely a local script:
- Review/approval happens in Google Sheets using a Google Apps Script.
- The local generator expects the curated "For Show" tab to be the published CSV source.

Source-of-truth copy of the Apps Script (for maintainers):
- `docs/google-apps-script/jobs_approval_and_email.js`

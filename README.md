# New York Romanian Group Website

This repository contains the official website for the **New York Romanian Group (NYRG)**.

---

## What this site is
- A **static website** (HTML, CSS, minimal JavaScript)
- Hosted via **GitHub Pages**
- Used to share:
  - Community information
  - Events and updates
  - Mentorship sign-ups
  - Instagram highlights
  - Photo galleries

## What this site is NOT
- Not a web app
- Not a backend service
- Not a CMS
- Not a blog

There is no database and no server code running.

---

## Live site
The site is published at:

👉 https://newyorkromaniangroup.github.io

---

## Repository structure (high level)

/
├── index.md # Home page
├── mentorship.md # Mentorship sign-up page
├── assets/
│ ├── style.css # Site styling
│ ├── site.js # Small JS for Instagram embeds
│ └── EDITING_GUIDE.md # How to update content (read this!)
├── data/
│ └── instagram.json # Auto-generated Instagram data
├── scripts/
│ ├── selenium_instagram_scrape.py
│ ├── daily_instagram_update.sh
│ └── test_instagram_update.sh
└── _config.yml # GitHub Pages config

---

## How deployment works
- GitHub Pages builds directly from the **`main` branch**
- Any commit pushed to `main` updates the live site automatically
- No manual deploy steps are required

---

## Making content updates
If you are editing text, photos, or links:

👉 **Read `assets/EDITING_GUIDE.md` first**

It explains exactly what is safe to change and how.

---

## Technical notes
- Instagram content is **auto-updated** via a script
- Do not manually edit `data/instagram.json` unless you know what you are doing
- Scripts are documented and safe to run locally

---

If you are unsure about any change, ask before editing.
The goal is to keep this site stable, simple, and easy to maintain.

# NYRG Website Editing Guide (for collaborators)

This guide explains how to safely update the NYRG website.
You do **not** need to be a developer to make most changes.

If something here feels unclear, stop and ask before editing.

---

## Quick map: what to edit

Most collaborators will only touch these files:

- Home page copy and embeds: `index.md`
- Gallery page copy (cards are auto-rendered): `gallery.md`
- Jobs page copy (jobs are auto-rendered): `jobs.md`
- Mentorship page copy + embedded Google Form: `mentorship.md`

Site-wide layout files (edit with care):

- Shared header/nav: `_includes/header.html`
- Shared footer: `_includes/footer.html`
- Base layout wrapper: `_layouts/default.html`
- Styling: `assets/style.css`
- Client-side behavior: `assets/site.js`

Generated data files (usually **do not** edit by hand):

- `data/instagram.json` (Instagram feed URLs)
- `data/gallery.json` (Gallery events + thumbnails)
- `data/jobs.json` (Jobs board data)

---

## What you can safely edit

- Text content on pages (`index.md`, `gallery.md`, `jobs.md`, `mentorship.md`)
- Links (URLs) and button text
- The embedded Google Form URL on the mentorship page
- High-level styling tweaks in `assets/style.css` (colors, spacing, font sizes)

---

## What you should NOT edit (unless you are a maintainer)

- `data/*.json` (these are generated)
- Anything inside `scripts/` (automation)
- `_config.yml` (Jekyll configuration)

---

## 1) Instagram posts on the Home page

**You do NOT manually update Instagram embeds.**

Instagram content is updated automatically using a script that:
- Visits the NYRG Instagram profile
- Extracts the latest posts
- Updates `data/instagram.json`

The website then reads `data/instagram.json` at runtime and renders embeds
with safe fallbacks (links), even if embeds are blocked.

### If Instagram looks broken on the site

This can happen due to:
- Browser privacy settings
- Ad blockers
- Instagram blocking embeds

This is expected and OK.

Visitors will still see:
- A Follow button
- Clickable fallback links to posts

**Do not try to “fix” this by editing HTML unless instructed.**

---

## 2) Updating the photo gallery

You normally update gallery content by updating the **Google Drive folders**,
then running the gallery JSON generator.

The Gallery page renders cards from: `data/gallery.json`

### Folder naming recommendation (helps sorting)

Use a month + year in the folder name, for example:
- `Feb 2026 - Event Name`
- `Feb2026 Event Name`

### Hiding a folder from the website

Prefix the folder name with:
- `(not for website)`

---

## 3) Updating the Mentorship Google Form

File to edit:
- `mentorship.md`

Look for the `<iframe>` under the signup section.

### How to update it

1. Open the Google Form
2. Click **Send**
3. Choose the embed tab (`<>`)
4. Copy the iframe `src="..."` URL
5. Replace the existing `src` URL in the file

If the form looks cut off:
- Adjust the `height="..."` value until it looks right

---

## 4) Updating Job Postings

Jobs are submitted via a Google Form and reviewed in a Google Sheet.

Important: the Jobs sheet uses a **Google Apps Script** layer to:
- add a `Status` dropdown to `Form_Responses`
- copy approved rows into `For Show`
- optionally email reviewers about pending submissions

The site’s jobs board renders from: `data/jobs.json` (generated from the `For Show` tab).

Maintainer documentation:
- `docs/jobs-pipeline.md`

---

## 5) Previewing your changes

### Branch previews (recommended)

If you push a branch (not `main`), GitHub Actions will deploy a preview at:

`https://newyorkromaniangroup.github.io/<branch-name>/`

This is the easiest way to review changes without affecting production.

### Local preview (optional)

You can run Jekyll locally if you have Ruby/Jekyll installed.
Maintainers can document that workflow as needed.

---

## Final reminder

This site is designed to be:
- Simple
- Stable
- Easy to maintain

If something feels risky, stop and ask before committing.

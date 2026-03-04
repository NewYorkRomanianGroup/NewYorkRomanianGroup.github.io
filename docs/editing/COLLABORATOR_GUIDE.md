# NYRG Collaborator Guide

This guide is for anyone contributing to the NYRG website repo, including people who are new to coding.

## How the site works (1 minute overview)

- The site is a static GitHub Pages site built with Jekyll.
- Most pages are Markdown files that contain HTML blocks.
- Styling is in `assets/style.css`
- Client-side behavior (Instagram, Gallery, Jobs) is in `assets/site.js`
- Some content is generated into `data/*.json` so updates can be made from Google Drive/Sheets.

## Safe edits (no coding required)

You can safely edit these files for text and links:
- `index.md` (home page copy and embeds)
- `mentorship.md` (mentorship copy and embedded Google Form)
- `jobs.md` (jobs page wording only, not the IDs)
- `gallery.md` (gallery page wording only, not the IDs)

If you are only changing wording, avoid touching:
- element `id="..."` attributes
- `{{ ... | relative_url }}` snippets (those keep branch previews working)

## Generated data files

Note: the Jobs pipeline includes a Google Apps Script layer inside the Jobs Google Sheet
that handles approve/reject and copies approved rows into the curated tab.
See: `docs/jobs-pipeline.md`.


These are usually not edited manually:
- `data/instagram.json`
- `data/gallery.json`
- `data/jobs.json`

If you need to update them, run the generator scripts or ask a maintainer.

## Branch previews

Any non-main branch is automatically deployed to:

  https://newyorkromaniangroup.github.io/<branch-name>/

This allows reviewers to test changes without affecting production.

## Need help?

If you are not sure whether a change is safe, open a PR and ask in the description.

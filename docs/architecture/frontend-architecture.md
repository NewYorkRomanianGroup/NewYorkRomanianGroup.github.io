# Frontend architecture (quick)

This site uses Jekyll + small client-side JS enhancements.

## Jekyll layout structure

- `_layouts/default.html`
  - Base HTML wrapper, loads CSS + JS, includes header/footer

- `_includes/header.html`
  - Shared navigation
  - Must keep internal links using `| relative_url` (branch previews)

- `_includes/footer.html`
  - Shared footer
  - Year is filled by a small script in the default layout

## Pages

Most pages are Markdown files with HTML blocks:
- `index.md`
- `gallery.md`
- `jobs.md`
- `mentorship.md`

## Data files

Some content is generated into JSON:
- `data/instagram.json`
- `data/gallery.json`
- `data/jobs.json`

## Client-side rendering (assets/site.js)

At runtime, `assets/site.js` loads the JSON files and fills in placeholders.

Common “gotchas”:
- If you rename an element ID in a page file, you must update the selector in `site.js`.
- If previews break, check for any hard-coded `/assets/...` paths that should be `| relative_url`.

## Styling (assets/style.css)

Most site theming is controlled by CSS variables in `:root`.
If you want to adjust the site's look, start there.

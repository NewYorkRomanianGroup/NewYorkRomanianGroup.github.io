# Branch previews (how they work)

This repo supports branch preview deployments. Any non-main branch is deployed to:

`https://newyorkromaniangroup.github.io/<branch-name>/`

## Why this exists

It lets collaborators review changes without impacting the production site.

## How it works (high level)

A GitHub Actions workflow runs on:
- push to any branch except `main`
- branch deletion

On push:
- It checks out the pushed branch and also checks out `main` into a subfolder.
- It copies the site files into: `main/<branch-name>/`
- It commits and pushes that folder to `main`.

On branch deletion:
- It removes the `main/<branch-name>/` folder and pushes that change.

## The most important rule for contributors

Use `| relative_url` for internal links and assets in templates and markdown.

Examples:

Good:
- `{{ '/assets/style.css' | relative_url }}`
- `{{ '/gallery.html' | relative_url }}`

Risky (breaks previews):
- `/assets/style.css`
- `/gallery.html`

## Where to look

- Workflow: `.github/workflows/branch-previews.yml`
- Layout base: `_layouts/default.html`
- Header links: `_includes/header.html`

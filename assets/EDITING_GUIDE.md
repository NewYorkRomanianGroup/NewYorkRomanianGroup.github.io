# NYRG Website Editing Guide (for collaborators)

This guide explains how to safely update the NYRG website.
You do **not** need to be a developer to make these changes.

If something here feels unclear, stop and ask before editing.

---

## What you can safely edit
- Text content on pages
- Google Drive photo folder
- Mentorship Google Form
- Section descriptions and wording

## What you should NOT edit
- `assets/site.js`
- `assets/instagram.json`
- Anything inside `scripts/`
- `_config.yml`

Those files are automated or configuration-related.

---

## 1) Instagram posts on the Home page

**You do NOT manually update Instagram embeds anymore.**

Instagram content is updated automatically using a script that:
- Visits the NYRG Instagram profile
- Extracts the latest posts
- Updates `assets/instagram.json`

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

## 2) Updating the Google Drive photo gallery

File to edit:
- `index.html`

Look for this line:

https://drive.google.com/embeddedfolderview?id=DRIVE_FOLDER_ID#grid


### How to update it
1. Create a Google Drive folder (for example: “NYRG Photos”)
2. Set sharing to:
   - “Anyone with the link can view”
3. Copy the folder URL
4. Find the part after `/folders/`  
   That is the folder ID
5. Replace `DRIVE_FOLDER_ID` with the real ID

### Important notes
- If the folder is not shared correctly, photos will NOT appear
- Only photos inside that folder will show on the site

---

## 3) Updating the Mentorship Google Form

File to edit:
- `mentorship.html`

Look for the `<iframe>` under **Interest Form**.

### How to update it
1. Open the Google Form
2. Click **Send**
3. Choose the embed tab (`<>`)
4. Copy the iframe `src="..."` URL
5. Replace the existing `src` URL in the file

If the form looks cut off:
- Adjust the `height="900"` value until it looks right

---

## 4) Updating text content

You can safely edit:
- Headings
- Paragraph text
- Descriptions under sections

Avoid:
- Removing `<section>`, `<div>`, or `<iframe>` tags
- Changing element IDs (for example `insta-latest`)

When in doubt:
- Change words, not structure

---

## 5) Previewing your changes

You can preview locally by:
- Opening `index.html` or `mentorship.html` directly in a browser

After pushing changes to GitHub:
- The live site updates automatically within a minute or two

---

## Final reminder
This site is designed to be:
- Simple
- Stable
- Easy to maintain

If something feels risky, stop and ask before committing.

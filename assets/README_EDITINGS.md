# NYRG Website Editing Notes (for collaborators)

## 1) Updating Instagram posts on the Home page
File: `index.html`

Look for:
- `data-instgrm-permalink="https://www.instagram.com/p/REPLACE_1/"`
- `data-instgrm-permalink="https://www.instagram.com/p/REPLACE_2/"`

Replace each with a real Instagram post URL.

If embeds do not load:
- Instagram sometimes blocks embeds or requires cookies.
- Simple fallback: replace the embed section with plain links to recent posts.

## 2) Updating the Google Drive photo folder
File: `index.html`

Replace:
- `DRIVE_FOLDER_ID`

How to find the folder ID:
- It is the part after `/folders/` in the folder URL.

Sharing settings matter:
- If the folder is not shared publicly (or at least viewable by visitors), it will not render for the public site.

## 3) Updating the Mentorship Google Form
File: `mentorship.html`

Replace:
- `GOOGLE_FORM_EMBED_URL`

How to get it:
- Google Form → Send → embed tab (<>)
- Copy the `src="..."` URL from the iframe snippet and paste it in.

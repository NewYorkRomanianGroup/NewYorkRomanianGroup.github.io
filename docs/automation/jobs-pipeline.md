# Jobs pipeline (Google Form → Website)

This site’s jobs board is intentionally “non-technical collaborator friendly”.
The goal is that someone can submit a job via a Google Form, and a reviewer can approve it without writing code.

## High-level flow

Google Form
  → Google Sheet tab: `Form_Responses`
    → Reviewer sets `Status` (PENDING / APPROVE / REJECT)
      → Google Apps Script (in the sheet) reacts:
        - APPROVE: append a curated row into `For Show`
        - REJECT: mark as rejected and copy to `Rejected`
          → Local script generates `data/jobs.json`
            → Site renders in `jobs.md` via `assets/site.js`

## Spreadsheet tabs (must match names)

- `Form_Responses`
  - Raw Google Form responses.
  - Must include a header column named `Status` (added manually).
  - Reviewers use the Status dropdown to approve or reject.

- `For Show`
  - Curated table that feeds `jobs.json`.
  - Rows here are “approved” jobs.
  - The local JSON generator reads this tab.

- `Rejected` (optional, created automatically)
  - Script creates this tab if it does not exist.
  - Stores rejected submissions for recordkeeping.

## Required header text in `Form_Responses`

The Apps Script uses header text to locate columns. These must match exactly:

- Timestamp
- Email Address
- Job Name/Title
- Company/Who you
- Description
- Location
- Deadline (if any)
- Status

If you change the Google Form questions and the header text changes, you must update the Apps Script.

## `For Show` columns (expected order)

The Apps Script appends new rows in this exact order:

1. Title
2. Company/Person
3. Description
4. Location
5. Apply URL/Insta/Email (currently filled with submitter email as a placeholder)
6. Deadline
7. Show? (boolean)
8. Notes

If you reorder or rename columns in `For Show`, update BOTH:
- the Apps Script appendRow mapping
- the local jobs.json generator

## Apps Script triggers

- `setupNYRGJobApproval()` installs an *installable* onEdit trigger for the sheet.
- The onEdit handler only reacts when a cell in the `Status` column is edited.

Daily email reminders:
- `dailyPendingJobEmail()` should be run by a time-based trigger (daily).
- The recipient list is controlled by `REVIEW_EMAILS` in the script.

## Where this script lives

This is not in the GitHub repo by default.
It lives inside the Google Sheet: Extensions → Apps Script.

Recommendation:
- Keep an exported copy in the repo at `docs/google-apps-script/jobs_approval_and_email.js`
  so future maintainers have a source of truth.

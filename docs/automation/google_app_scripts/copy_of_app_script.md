/**
 * NYRG Jobs: Approve/Reject + Daily email reminder
 *
 * Tabs expected:
 * - Form_Responses (Google Form responses)
 * - Jobs (curated sheet that generates jobs.md)
 *
 * Form_Responses columns (by header text):
 * - Timestamp
 * - Email Address
 * - Job Name/Title
 * - Company/Who you
 * - Description
 * - Location
 * - Deadline (if any)
 * - Status   <-- you add this
 *
 * Jobs columns:
 * - Title
 * - Company/Person
 * - Description
 * - Location
 * - Apply URL/Insta/Email
 * - Deadline
 * - Show?
 * - Notes
 */

// ---------------- USER SETTINGS ----------------
const FORM_SHEET_NAME = "Form_Responses";
const JOBS_SHEET_NAME = "For Show";
const REJECTED_SHEET_NAME = "Rejected";

// Emails for daily reminders (comma-separated)
const REVIEW_EMAILS = "gregory.c2009@gmail.com,newyorkromaniangroup@gmail.com";

// Status values reviewers choose
const STATUS_PENDING = "PENDING";
const STATUS_APPROVE = "APPROVE";
const STATUS_REJECT  = "REJECT";

// Status values script writes
const STATUS_MOVED    = "APPROVED (MOVED)";
const STATUS_REJECTED = "REJECTED";

// ---------------- SETUP (run once) ----------------
function setupNYRGJobApproval() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = mustGetSheet_(ss, FORM_SHEET_NAME);

  const statusCol = findHeaderCol_(form, "Status");
  if (!statusCol) {
    throw new Error('Add a "Status" column header to Form_Responses first.');
  }

  // Dropdown validation for Status
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList([STATUS_PENDING, STATUS_APPROVE, STATUS_REJECT], true)
    .setAllowInvalid(false)
    .build();

  const lastRow = Math.max(form.getLastRow(), 2);
  const range = form.getRange(2, statusCol, Math.max(1, lastRow - 1 + 200), 1);
  range.setDataValidation(rule);

  // Fill blank Status cells with PENDING
  const vals = range.getValues();
  for (let i = 0; i < vals.length; i++) {
    if (!String(vals[i][0] || "").trim()) vals[i][0] = STATUS_PENDING;
  }
  range.setValues(vals);

  // Installable onEdit trigger (avoid duplicates)
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "onEditNYRGJobApproval") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("onEditNYRGJobApproval")
    .forSpreadsheet(ss)
    .onEdit()
    .create();
}

// ---------------- ON EDIT HANDLER ----------------
function onEditNYRGJobApproval(e) {
  if (!e) return;

  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== FORM_SHEET_NAME) return;

  const ss = sheet.getParent();
  const form = sheet;
  const jobs = mustGetSheet_(ss, JOBS_SHEET_NAME);

  const statusCol = findHeaderCol_(form, "Status");
  if (!statusCol) return;

  // Only react to edits in Status column, not header row
  if (range.getColumn() !== statusCol) return;
  if (range.getRow() < 2) return;

  const newValue = String(e.value || "").trim().toUpperCase();
  if (newValue !== STATUS_APPROVE && newValue !== STATUS_REJECT) return;

  const row = range.getRow();
  const rowValues = form.getRange(row, 1, 1, form.getLastColumn()).getValues()[0];

  const timestamp = getByHeader_(form, rowValues, "Timestamp");
  const email = getByHeader_(form, rowValues, "Email Address");
  const title = getByHeader_(form, rowValues, "Job Name/Title");
  const company = getByHeader_(form, rowValues, "Company/Who you");
  const desc = getByHeader_(form, rowValues, "Description");
  const location = getByHeader_(form, rowValues, "Location");
  const deadline = getByHeader_(form, rowValues, "Deadline (if any)");

  if (newValue === STATUS_APPROVE) {
    if (jobAlreadyExists_(jobs, title, company)) {
      form.getRange(row, statusCol).setValue(STATUS_MOVED + " (DUPLICATE FOUND)");
      return;
    }

    // Append to Jobs tab
    jobs.appendRow([
      title,
      company,
      desc,
      location,
      email,     // placeholder for Apply URL/Insta/Email
      deadline,
      true,      // Show?
      ""         // Notes
    ]);

    form.getRange(row, statusCol).setValue(STATUS_MOVED);
    return;
  }

  // REJECT
  form.getRange(row, statusCol).setValue(STATUS_REJECTED);

  const rejected = getOrCreateRejected_(ss);
  rejected.appendRow([timestamp, email, title, company, desc, location, deadline, STATUS_REJECTED]);
}

// ---------------- DAILY EMAIL REMINDER ----------------
function dailyPendingJobEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = mustGetSheet_(ss, FORM_SHEET_NAME);

  const data = form.getDataRange().getValues();
  if (data.length < 2) return;

  // Map headers -> col index
  const headers = data[0].map(h => String(h || "").trim());
  const col = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const cTimestamp = col("Timestamp");
  const cTitle = col("Job Name/Title");
  const cCompany = col("Company/Who you");
  const cStatus = col("Status");

  // If there is no Status column, do nothing
  if (cStatus === -1) return;

  const pending = [];
  for (let r = 1; r < data.length; r++) {
    const status = String(data[r][cStatus] || "").trim().toUpperCase();
    if (status === "" || status === STATUS_PENDING) {
      pending.push({
        timestamp: cTimestamp === -1 ? "" : data[r][cTimestamp],
        title: cTitle === -1 ? "" : data[r][cTitle],
        company: cCompany === -1 ? "" : data[r][cCompany],
      });
    }
  }

  if (pending.length === 0) return;

  let body = "Pending job submissions (not yet approved/rejected):\n\n";
  pending.forEach((p, i) => {
    body += `${i + 1}. ${p.title} – ${p.company} (${p.timestamp})\n`;
  });

  body += "\nReview here:\n" + ss.getUrl();

  MailApp.sendEmail({
    to: REVIEW_EMAILS,
    subject: `NYRG Jobs – ${pending.length} pending submission(s)`,
    body: body
  });
}

// ---------------- HELPERS ----------------
function mustGetSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`Missing sheet tab: ${name}`);
  return sh;
}

function findHeaderCol_(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const target = headerName.trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim().toLowerCase() === target) return i + 1;
  }
  return null;
}

function getByHeader_(sheet, rowValues, headerName) {
  const col = findHeaderCol_(sheet, headerName);
  if (!col) return "";
  return rowValues[col - 1];
}

function jobAlreadyExists_(jobsSheet, titleRaw, companyRaw) {
  const title = String(titleRaw || "").trim().toLowerCase();
  const company = String(companyRaw || "").trim().toLowerCase();
  if (!title && !company) return false;

  const lastRow = jobsSheet.getLastRow();
  if (lastRow < 2) return false;

  const vals = jobsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < vals.length; i++) {
    const t = String(vals[i][0] || "").trim().toLowerCase();
    const c = String(vals[i][1] || "").trim().toLowerCase();
    if (t === title && c === company) return true;
  }
  return false;
}

function getOrCreateRejected_(ss) {
  let sh = ss.getSheetByName(REJECTED_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(REJECTED_SHEET_NAME);
    sh.appendRow([
      "Timestamp",
      "Email Address",
      "Job Name/Title",
      "Company/Who you",
      "Description",
      "Location",
      "Deadline (if any)",
      "Status"
    ]);
  }
  return sh;
}
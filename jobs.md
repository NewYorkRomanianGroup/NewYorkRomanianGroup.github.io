---
layout: default
title: Job Postings
description: Monthly job postings for the NYRG community.
permalink: /jobs.html
---

<!--
  PAGE: Jobs (jobs.md)

  This file defines the HTML shell for the jobs board:
  - the empty state card (shown when 0 jobs)
  - the filter/search controls
  - the container where job cards are injected

  Job data is loaded at runtime from: data/jobs.json
  The renderer lives in: assets/site.js (function loadJobsPage)

  Safe edits:
  - Wording on this page (headings, empty state message)
  - The "Submit a job" button text
  - The sort option labels (do not change option values without updating JS)

  Avoid:
  - Renaming the element IDs used by JS (jobs-grid, jobs-search, etc.)
  - Removing window.__NYRG_BASEURL or __NYRG_JOBS_SUBMIT_URL
-->

<section class="hero">
  <div class="container">
    <h1>Job Postings</h1>
    <p>Community-submitted roles and referrals.</p>
  </div>
</section>

<section class="container" style="padding-bottom: 36px;">

  <!-- EMPTY STATE (shown when 0 jobs after filtering rules in jobs.json) -->
  <div id="jobs-empty" class="card">
    <h2 style="margin-top: 0;">Open roles</h2>
    <p class="small">
      Nothing currently available. Check back soon for new opportunities from the NYRG community.
    </p>

    <!-- Optional: keep this small CTA even when empty -->
    <div style="margin-top: 10px;">
      <a id="jobs-submit-btn-empty" class="jobs-submit-btn" href="#" target="_blank" rel="noopener">
        Submit a job
      </a>
    </div>
  </div>

  <!-- JOB BOARD (shown when there are jobs) -->
  <div id="jobs-board" style="display:none;">
    <div class="card">
      <div class="jobs-header-row">
        <div>
          <h2 style="margin-top:0; margin-bottom: 4px;">Open roles</h2>
          <div id="jobs-count" class="small"></div>
        </div>

        <a id="jobs-submit-btn" class="jobs-submit-btn" href="#" target="_blank" rel="noopener">
          Submit a job
        </a>
      </div>

      <!-- Controls
           - Search: free text across title/company/location/notes
           - Filters: options are populated from jobs.json at runtime
           - Sort: only changes ordering client-side (no server)
      -->
      <div class="jobs-controls">
        <input id="jobs-search" class="jobs-input" type="text" placeholder="Search title, company, location, notes" />

        <select id="jobs-filter-location" class="jobs-select">
          <option value="">All locations</option>
        </select>

        <select id="jobs-filter-type" class="jobs-select">
          <option value="">All types</option>
        </select>

        <select id="jobs-filter-company" class="jobs-select">
          <option value="">All companies</option>
        </select>

        <select id="jobs-sort" class="jobs-select">
          <option value="deadline_soonest">Sort: Deadline (soonest)</option>
          <option value="deadline_latest">Sort: Deadline (latest)</option>
          <option value="company_az">Sort: Company (A–Z)</option>
          <option value="title_az">Sort: Title (A–Z)</option>
        </select>

        <button id="jobs-clear" class="jobs-clear-btn" type="button">Clear</button>
      </div>

      <div id="jobs-grid" class="jobs-grid"></div>
    </div>
  </div>

</section>

<script>
  // Important for branch previews: baseurl is /branch-name
  window.__NYRG_BASEURL = "{{ site.baseurl }}";

  // Set this to your Google Form URL once you have it
  // Example: https://docs.google.com/forms/d/e/.../viewform
  window.__NYRG_JOBS_SUBMIT_URL = "https://docs.google.com/forms/d/1CPWkYPNPFUwmc1KTm8ypt1GqQixBpH5smOqL2UXCY8g/viewform";

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof loadJobsPage === "function") loadJobsPage();
  });
</script>

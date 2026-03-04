---
layout: default
title: Gallery
description: Photos from NYRG events.
permalink: /gallery.html
---

<!--
  PAGE: Gallery (gallery.md)

  This page contains placeholders that are filled in by assets/site.js using data/gallery.json.

  Two sections are rendered:
  - Recent Events: card layout with thumbnails (desktop: 4 cards, mobile: 2 cards)
  - Past Events: simple list of older albums

  Safe edits:
  - Headings and descriptive text
  - The helper text above each section

  Avoid:
  - Renaming the container IDs (gallery-events-grid, gallery-drive-link, gallery-past-events)
  - Removing the surrounding .card containers unless you also update CSS/JS
-->

<section class="hero">
  <div class="container">
    <h1>Gallery</h1>
    <p>Photos from recent NYRG events. Click an event to open the full album.</p>
  </div>
</section>

<section class="container" style="padding-bottom: 36px;">
  <!--
    These cards are rendered by assets/site.js from data/gallery.json.

    Goals:
    - Desktop: show 4 event cards (2x2)
    - Mobile: show only 2 event cards
    - Below: show a full-width "Open Shared Folder" card

    Why JS?
    - We auto-sort events by month
    - We can support external (password-locked) albums from a Google Sheet
    - We can rotate thumbnails every 5 seconds (Drive albums)
  -->

  <div class="card">
    <h2 style="margin-top: 0;">Recent Events</h2>
    <div id="gallery-events-grid" class="gallery-grid" aria-label="Recent gallery events"></div>

    <!-- Full-width link card (C5) injected here by JS -->
    <div id="gallery-drive-link" style="margin-top: 14px;"></div>
  </div>

  <div class="card" style="margin-top: 14px;">
    <h2 style="margin-top: 0;">Past Events</h2>
    <p class="small" style="margin-top: 6px;">A simple list of older albums.</p>
    <div id="gallery-past-events" class="gallery-list"></div>
  </div>
</section>

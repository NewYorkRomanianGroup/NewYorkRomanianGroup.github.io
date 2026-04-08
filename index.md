---
layout: default
title: New York Romanian Group | Romania GitHub Community
description: The official New York Romanian Group (NYRG). Connecting the Romanian community in New York through meetups, mentorship, and Romania GitHub resources.
---

<!--
  PAGE: Home (index.md)

  Safe edits for non-technical collaborators:
  - Text inside <h1>, <h2>, <p>, <a> tags
  - Links (href values) that point to NYRG resources
  - The Spotify playlist embed URL (src) if we ever change playlists

  Please avoid:
  - Removing element IDs because assets/site.js looks them up
  - Removing the Liquid filter | relative_url on internal assets
  - Changing the layout front matter unless you know Jekyll

  If something looks broken, check the browser console first.
-->

<section class="hero banner-hero">
  <img src="{{ '/assets/nyrg.banner.png' | relative_url }}"
     alt="New York Romanian Group community banner for the Romania GitHub project"
     class="hero-banner-image">

  <div class="hero-banner-copy">
    <h1>New York Romanian Group</h1>
    <p>
      NYRG is a premier community for Romanians in New York. We host meetups,
      share New York Romania GitHub resources, and connect people through mentorship.
    </p>
  </div>
</section>

<!--
  #featured-row
  Top row: featured event card (left) + right slot (photos OR calendar).
  JS controls layout class and what appears in the right slot.
  Do not remove any of the IDs.
-->
<div id="featured-row">

  <!-- Left slot: Featured Event card — populated by site.js -->
  <div id="featured-event-card" class="card featured-event-card" style="display:none;" aria-label="Featured upcoming event">
  </div>

  <!-- Right slot A: Featured Photos (default) -->
  <section class="photo-rotator card" id="featured-photos-card" aria-label="Featured community photos">
    <h2>Featured Photos</h2>

    <div class="rotator-frame">
      <img
        id="hero-rotator-image"
        src="{{ '/assets/image.png' | relative_url }}"
        alt="NYRG featured community photo"
        class="rotator-image"
        loading="lazy"
      >
    </div>

    <div id="hero-rotator-slides" class="hidden-slides" aria-hidden="true"></div>

    <div class="rotator-controls">
      <button class="btn" id="hero-rotator-prev" type="button" aria-label="Show previous photo">Previous</button>
      <div class="small" id="hero-rotator-caption">Skyline meetup moments</div>
      <button class="btn" id="hero-rotator-next" type="button" aria-label="Show next photo">Next</button>
    </div>
  </section>

  <!-- Right slot B: Luma calendar — shown by site.js when needed, replaces photos in top row -->
  <div id="luma-calendar-slot" style="display:none; flex:1; min-width:0;">
    <iframe
      src="https://lu.ma/embed/calendar/cal-qOrYkgFc93AqbB1/events"
      width="100%"
      height="100%"
      style="min-height: 420px; border-radius: var(--radius-lg); border: 1px solid var(--border);"
      frameborder="0"
      allow="fullscreen; payment"
      aria-label="Luma upcoming events calendar"
      tabindex="0"
    ></iframe>
  </div>

</div><!-- /featured-row -->

<!--
  #secondary-row
  Bottom row — shown by site.js when needed.
  Holds Other Events and/or Featured Photos depending on layout case.
  Do not remove any of the IDs.
-->
<div id="secondary-row" style="display:none;">
  <div id="other-events-slot" style="display:none;">
    <div class="card">
      <h2 style="margin-top:0;">Other Events</h2>
      <div id="other-events-container"></div>
    </div>
  </div>
  <div id="secondary-photos-slot" style="display:none;">
    <!-- Photos card is moved here by JS when needed -->
  </div>
</div>

<section class="grid" id="home-social-grid">
  <div class="card" id="instagram-card">
    <h2>Latest from Instagram</h2>
    <p>
      Follow
      <a href="https://www.instagram.com/newyorkromaniangroup/" target="_blank" rel="noopener">
        @newyorkromaniangroup
      </a>
      for event announcements and updates.
    </p>

    <div style="margin: 10px 0 14px 0;">
      <a class="btn-ig" href="https://www.instagram.com/newyorkromaniangroup/" target="_blank" rel="noopener">
        Follow on Instagram
      </a>
    </div>

    <div class="embed-wrap" style="padding: 12px;">
      <div id="insta-latest" class="insta-grid"></div>
      <div class="small" style="margin-top: 12px;">
        <div id="insta-fallback-links"></div>
      </div>
    </div>

    <div class="embed-wrap insta-profile-wrap" style="padding: 12px; margin-bottom: 12px;">
      <blockquote
        class="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/newyorkromaniangroup/"
        data-instgrm-version="14"
        style="margin: 0 auto; max-width: 540px; min-width: 280px;"
      ></blockquote>
    </div>
  </div>
</section>

<section style="padding-bottom: 36px;">
  <iframe
    data-testid="embed-iframe"
    style="border-radius:12px"
    src="https://open.spotify.com/embed/playlist/0QDUXCzu4fLHWrDSP9sxpJ?utm_source=generator&theme=0"
    width="90%"
    height="352"
    frameBorder="0"
    allowfullscreen=""
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
    title="NYRG Spotify playlist"
  ></iframe>
</section>
---
layout: default
title: New York Romanian Group | Romania GitHub Community
description: The official New York Romanian Group (NYRG). Connecting the Romanian community in New York through meetups, mentorship, and Romania GitHub resources.
---

<!--
  PAGE: Home (index.md)

  This file is mostly HTML inside a Jekyll markdown wrapper.

  Safe edits for non-technical collaborators:
  - Text inside <h1>, <h2>, <p>, <a> tags
  - Links (href values) that point to NYRG resources
  - The Spotify playlist embed URL (src) if we ever change playlists

  Please avoid:
  - Removing element IDs (like id="insta-latest") because assets/site.js looks them up
  - Removing the Liquid filter | relative_url on internal assets
  - Changing the layout front matter unless you know Jekyll

  If something looks broken, check the browser console first.
-->

<section class="hero banner-hero">
  <!-- Homepage banner image shown above welcome text -->
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
  Rotating photos section (Featured Photos) — wrapped in a row with the event card above.
  NOTE for collaborators:
  - The rotator is populated by assets/site.js using data/gallery.json.
  - If the rotator looks empty, confirm data/gallery.json is present on the site.
  - If you want to switch back to hard-coded slides, uncomment the example block below.
  - Replace image URLs in data-image-url with your event photos.
  - Keep at least 2 slides for visible rotation.
-->

<!-- Outer wrapper: on desktop, event card (left) + photos (right) sit side-by-side -->
<div id="featured-row">

  <!-- Featured Event card — injected & shown/hidden by site.js -->
  <div id="featured-event-card" class="card featured-event-card" style="display:none;" aria-label="Featured upcoming event">
  </div>

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

  <!--
    Slide definitions for collaborators.
    Edit only data-image-url and data-caption.
  -->
  <!-- <div id="hero-rotator-slides" class="hidden-slides" aria-hidden="true">
    <div data-image-url="{{ '/assets/image.png' | relative_url }}" data-caption="Skyline meetup moments"></div>
    <div data-image-url="{{ '/assets/icon.png' | relative_url }}" data-caption="Romanian community in New York"></div>
    <div data-image-url="{{ '/assets/image.png' | relative_url }}" data-caption="Events and connections across the city"></div>
  </div> -->
  <div id="hero-rotator-slides" class="hidden-slides" aria-hidden="true"></div>

  <div class="rotator-controls">
    <button class="btn" id="hero-rotator-prev" type="button" aria-label="Show previous photo">Previous</button>
    <div class="small" id="hero-rotator-caption">Skyline meetup moments</div>
    <button class="btn" id="hero-rotator-next" type="button" aria-label="Show next photo">Next</button>
  </div>
</section>

</div><!-- /featured-row -->

<section class="grid" id="home-social-grid">
  <!-- =========================
       LEFT CARD: INSTAGRAM
       ========================= -->
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

      <!-- <div class="small" id="insta-updated-at" style="margin-top: 8px;"></div> -->
    </div>

    <div class="embed-wrap" style="padding: 12px;">
      <!-- <div class="small" style="margin-bottom: 10px;">
        Latest 3 posts (auto-updated). If embeds are blocked,
        use the links below.
      </div> -->

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

---
layout: default
title: New York Romanian Group
description: New York Romanian Group is a community for Romanians in New York. We host meetups, share resources, and connect people through mentorship.
permalink: /
---

<section class="hero banner-hero">
  <!-- Homepage banner image shown above welcome text -->
  <img src="assets/image.png" alt="New York Romanian Group banner" class="hero-banner-image">

  <div class="hero-banner-copy">
    <h1>Welcome!</h1>
    <p>
      NYRG is a community for Romanians in New York. We host meetups,
      share resources, and connect people through mentorship.
    </p>
  </div>
</section>

<!--
  Rotating photos section
  - Replace image URLs in data-image-url with your event photos.
  - Keep at least 2 slides for visible rotation.
-->
<section class="photo-rotator card" aria-label="Featured community photos">
  <h2>Featured Photos</h2>

  <div class="rotator-frame">
    <img
      id="hero-rotator-image"
      src="assets/image.png"
      alt="NYRG featured community photo"
      class="rotator-image"
      loading="lazy"
    >
  </div>

  <!--
    Slide definitions for collaborators.
    Edit only data-image-url and data-caption.
  -->
  <div id="hero-rotator-slides" class="hidden-slides" aria-hidden="true">
    <div data-image-url="assets/image.png" data-caption="Skyline meetup moments"></div>
    <div data-image-url="assets/icon.png" data-caption="Romanian community in New York"></div>
    <div data-image-url="assets/image.png" data-caption="Events and connections across the city"></div>
  </div>

  <div class="rotator-controls">
    <button class="btn" id="hero-rotator-prev" type="button" aria-label="Show previous photo">Previous</button>
    <div class="small" id="hero-rotator-caption">Skyline meetup moments</div>
    <button class="btn" id="hero-rotator-next" type="button" aria-label="Show next photo">Next</button>
  </div>
</section>

<section class="grid">
  <!-- =========================
       LEFT CARD: INSTAGRAM
       ========================= -->
  <div class="card">
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

      <div class="small" id="insta-updated-at" style="margin-top: 8px;"></div>
    </div>

    <div class="embed-wrap" style="padding: 12px; margin-bottom: 12px;">
      <blockquote
        class="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/newyorkromaniangroup/"
        data-instgrm-version="14"
        style="margin: 0 auto; max-width: 540px; min-width: 280px;"
      ></blockquote>
    </div>

    <div class="embed-wrap" style="padding: 12px;">
      <div class="small" style="margin-bottom: 10px;">
        Latest 3 posts (auto-updated). If embeds are blocked,
        use the links below.
      </div>

      <div id="insta-latest" class="insta-grid"></div>

      <div class="small" style="margin-top: 12px;">
        <div id="insta-fallback-links"></div>
      </div>
    </div>
  </div>

  <!-- =========================
       RIGHT CARD: PHOTO GALLERY
       ========================= -->
  <div class="card">
    <h2>Photo Highlights</h2>
    <p>Browse the full shared folder and open individual files below.</p>

    <div class="embed-wrap">
      <!--
        Shared Google Drive folder embed.
        Replace only the folder ID after /folders/ to switch folders.
      -->
      <iframe
        src="https://drive.google.com/drive/u/2/folders/1qHFOROkuAI5sICLSSxj0Bg_b5QxqTp4u"
        height="520"
        loading="lazy"
        title="NYRG Photo Highlights"
      ></iframe>

      <div class="small" style="margin-top: 10px;">
        To update this gallery, keep the URL format and replace only the folder ID.
      </div>
    </div>

    <div style="margin-top: 12px;">
      <a class="btn" href="https://drive.google.com/drive/folders/1qHFOROkuAI5sICLSSxj0Bg_b5QxqTp4u?usp=sharing" target="_blank" rel="noopener">
        Open Shared Folder
      </a>
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

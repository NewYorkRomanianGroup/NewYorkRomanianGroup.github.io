/**
 * NYRG site.js
 *
 * Purpose:
 * - Load the latest Instagram post URLs from: data/instagram.json
 * - Render up to 3 "best-effort" Instagram embeds on the homepage.
 * - Always provide clickable fallback links if embeds are blocked.
 *
 * This file is intentionally small and heavily commented because
 * collaborators may be new to coding.
 *
 * Dependencies (must exist in index.md):
 * - <div id="insta-latest"></div>            // Where embeds get injected
 * - <div id="insta-fallback-links"></div>   // Where fallback links appear
 * - <div id="insta-updated-at"></div>       // Optional "last updated" label
 *
 * Data format expected (data/instagram.json):
 * {
 *   "updated_at": "2026-02-07T12:34:56Z",
 *   "posts": [
 *     { "url": "https://www.instagram.com/p/POST_ID/" },
 *     ...
 *   ]
 * }
 */

/* =========================================================
   Small helpers (collaborator-friendly)
   ========================================================= */

// Hide/show an element without removing it from the DOM.
function setHidden(el, hidden) {
  if (!el) return;
  el.style.display = hidden ? "none" : "";
}

// On the homepage, Instagram and Photo Highlights sit in a 2-column grid.
// When photos are unavailable (Drive not accessible), we hide the photo cards
// and force the grid to become 1 column so Instagram takes the full width.
//
// NOTE: This expects index.md to have:
//   <section class="grid" id="home-social-grid">
function setHomeGridSingleColumn(on) {
  const homeGrid = document.getElementById("home-social-grid");
  if (!homeGrid) return;
  homeGrid.classList.toggle("grid--single", on);
}

// Hide or show both photo-related UI blocks together.
// This keeps layout behavior consistent across all failure modes.
function setPhotosVisibility({ show }) {
  const featuredCard = document.getElementById("featured-photos-card");
  const highlightsCard = document.getElementById("photo-highlights-card");

  if (show) {
    setHidden(featuredCard, false);
    setHidden(highlightsCard, false);
    setHomeGridSingleColumn(false);
  } else {
    setHidden(featuredCard, true);
    setHidden(highlightsCard, true);
    setHomeGridSingleColumn(true);
  }
}

function instaMaxPostsForWidth() {
  // "Narrow" breakpoint: match your CSS stack breakpoint
  return window.matchMedia("(max-width: 980px)").matches ? 2 : 4;
}

async function loadInstagramLatest() {
  const container = document.getElementById("insta-latest");
  const fallback = document.getElementById("insta-fallback-links");
  const updatedEl = document.getElementById("insta-updated-at");

  // If we are not on a page that has the Instagram section, do nothing.
  if (!container) return;

  // Small helper: safe HTML message (we only use known static strings here).
  const setMessage = (el, msg) => {
    if (!el) return;
    el.innerHTML = `<div class="small">${msg}</div>`;
  };

  try {
    // IMPORTANT:
    // Build an absolute URL based on the page base URL.
    // This makes it work on / and on /branch-name/ and on nested pages.
    const jsonUrl = new URL("data/instagram.json", document.baseURI);

    // Cache-bust to reduce stale JSON on GitHub Pages/CDN layers.
    jsonUrl.searchParams.set("_ts", String(Date.now()));

    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });

    // If the file is missing or returns an error, show a friendly message.
    if (!res.ok) {
      setMessage(container, "Instagram feed temporarily unavailable.");
      if (fallback) fallback.innerHTML = "";
      return;
    }

    const data = await res.json();

    // Extract up to 2 or 4 URLs (responsive) safely.
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    const maxPosts = instaMaxPostsForWidth();
    const urls = posts
      .map((p) => (p && typeof p.url === "string" ? p.url.trim() : ""))
      .filter(Boolean)
      .slice(0, maxPosts);

    // Show "updated at" label if present and valid.
    // if (updatedEl && typeof data?.updated_at === "string") {
    //   const d = new Date(data.updated_at);
    //   updatedEl.textContent = isNaN(d.getTime()) ? "" : `Updated: ${d.toLocaleString()}`;
    // } else if (updatedEl) {
    //   updatedEl.textContent = "";
    // }
    if (updatedEl) updatedEl.textContent = "";

    // If no URLs, show a message and exit.
    if (urls.length === 0) {
      setMessage(container, "No posts loaded yet. Check back soon.");
      if (fallback) fallback.innerHTML = "";
      return;
    }

    // Build embed placeholders.
    // Instagram will convert these <blockquote> elements into embeds.
    container.innerHTML = "";
    urls.forEach((url) => {
      const block = document.createElement("blockquote");
      block.className = "instagram-media";
      block.setAttribute("data-instgrm-permalink", url);
      block.setAttribute("data-instgrm-version", "14");
      container.appendChild(block);
    });

    // Build fallback links (useful if embeds are blocked by privacy tools).
    if (fallback) {
      fallback.innerHTML = urls
        .map((u, i) => {
          // const label = `Instagram post ${i + 1}`;
          // return `<div><a href="${u}" target="_blank" rel="noopener">${label}</a></div>`;
          return "";
        })
        .join("");
    }

    // Ensure Instagram embed script exists, then process embeds.
    // If the script is blocked, the fallback links remain usable.
    const processEmbeds = () => {
      if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
        window.instgrm.Embeds.process();
      }
    };

    if (!document.getElementById("ig-embed-script")) {
      const s = document.createElement("script");
      s.id = "ig-embed-script";
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = processEmbeds;
      document.body.appendChild(s);
    } else {
      processEmbeds();
    }
  } catch (e) {
    // If anything unexpected happens, fail gracefully.
    setMessage(container, "Instagram feed temporarily unavailable.");
    if (fallback) fallback.innerHTML = "";
    console.error(e);
  }
}

// Run immediately on page load.
// This file is included from the shared layout near the end of the page, so the DOM is already present.
loadInstagramLatest();

let lastMaxPosts = instaMaxPostsForWidth();
window.addEventListener("resize", () => {
  const nextMaxPosts = instaMaxPostsForWidth();
  if (nextMaxPosts !== lastMaxPosts) {
    lastMaxPosts = nextMaxPosts;
    loadInstagramLatest();
  }
});

async function loadGalleryRotatorSlides() {
  const slidesRoot = document.getElementById("hero-rotator-slides");
  const captionEl = document.getElementById("hero-rotator-caption");
  const imgEl = document.getElementById("hero-rotator-image");

  // If the featured rotator markup is not on this page, do nothing.
  // (This avoids errors on pages that do not include the rotator.)
  if (!slidesRoot || !imgEl) return;

  try {
    const jsonUrl = new URL("data/gallery.json", document.baseURI);
    jsonUrl.searchParams.set("_ts", String(Date.now()));

    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });

    // If gallery.json fails to load, treat it as "no accessible photos".
    // Hide Featured Photos and Photo Highlights, and let Instagram fill the width.
    if (!res.ok) {
      setPhotosVisibility({ show: false });
      return;
    }

    const data = await res.json();
    const images = Array.isArray(data?.images) ? data.images : [];

    const urls = images
      .map((x) => ({
        url: x && typeof x.url === "string" ? x.url.trim() : "",
        caption: "",
        webViewLink: x && typeof x.webViewLink === "string" ? x.webViewLink.trim() : ""
      }))
      .filter((x) => x.url);

    // If there are no usable images, hide both photo cards and let Instagram fill the width.
    if (urls.length === 0) {
      setPhotosVisibility({ show: false });
      return;
    }

    // Otherwise, show both photo cards and return the grid to 2 columns.
    setPhotosVisibility({ show: true });

    // Fill slides for the rotator logic.
    slidesRoot.innerHTML = "";
    urls.forEach((s) => {
      const d = document.createElement("div");
      d.setAttribute("data-image-url", s.url);
      d.setAttribute("data-caption", s.caption || "Featured photo");
      slidesRoot.appendChild(d);
    });

    if (captionEl) captionEl.textContent = urls[0].caption || "Featured photo";
    imgEl.src = urls[0].url;
    imgEl.alt = urls[0].caption || "Featured photo";
  } catch (e) {
    // Any unexpected error: hide both photo cards and let Instagram fill the width.
    setPhotosVisibility({ show: false });
    console.error(e);
  }
}

/**
 * Rotate featured photos on the homepage.
 *
 * This reads slide entries from #hero-rotator-slides where each child has:
 * - data-image-url: image URL to show
 * - data-caption: text shown below the image
 */
function loadHeroRotator() {
  const imgEl = document.getElementById("hero-rotator-image");
  const slidesRoot = document.getElementById("hero-rotator-slides");
  const captionEl = document.getElementById("hero-rotator-caption");
  const prevBtn = document.getElementById("hero-rotator-prev");
  const nextBtn = document.getElementById("hero-rotator-next");

  // If this page does not have the rotator section, stop early.
  if (!imgEl || !slidesRoot) return;

  const slides = Array.from(slidesRoot.children)
    .map((el) => ({
      url: (el.getAttribute("data-image-url") || "").trim(),
      caption: (el.getAttribute("data-caption") || "").trim()
    }))
    .filter((s) => s.url);

  if (slides.length === 0) return;

  let idx = 0;

  const render = () => {
    const active = slides[idx];
    imgEl.src = active.url;
    if (active.caption) imgEl.alt = active.caption;
    if (captionEl) captionEl.textContent = active.caption || "Featured photo";
  };

  const move = (step) => {
    idx = (idx + step + slides.length) % slides.length;
    render();
  };

  if (prevBtn) prevBtn.addEventListener("click", () => move(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => move(1));

  // Auto-rotate every 4 seconds.
  if (slides.length > 1) {
    setInterval(() => move(1), 4000);
  }

  render();
}

loadGalleryRotatorSlides().then(loadHeroRotator);

/**
 * Photo Highlights uses a Google Drive iframe.
 *
 * We cannot read iframe contents (browser security: cross-origin).
 * So we use a "best effort" approach:
 * - If the iframe does not load quickly, assume Drive is not accessible.
 * - If it loads but looks unusually small, assume it is blocked or login-walled.
 *
 * When Drive is not accessible, hide BOTH photo cards and let Instagram fill the width.
 */
function hideIfDriveRequiresLogin() {
  const highlightsCard = document.getElementById("photo-highlights-card");
  if (!highlightsCard) return;

  const iframe = highlightsCard.querySelector("iframe");
  if (!iframe) return;

  let loaded = false;

  // If iframe loads successfully.
  iframe.addEventListener("load", () => {
    loaded = true;

    // Give it a small delay to render.
    setTimeout(() => {
      try {
        // Heuristic: a blocked or login view sometimes results in a small iframe.
        // If this trips in your testing, raise the threshold slightly.
        if (iframe.offsetHeight < 200) {
          setPhotosVisibility({ show: false });
        }
      } catch (e) {
        // Any weirdness: hide photos.
        setPhotosVisibility({ show: false });
      }
    }, 500);
  });

  // If nothing loads within 3 seconds, assume login wall or blocked embed.
  setTimeout(() => {
    if (!loaded) {
      setPhotosVisibility({ show: false });
    }
  }, 3000);
}

document.addEventListener("DOMContentLoaded", hideIfDriveRequiresLogin);

/* =========================================================
   Gallery page renderer (data/gallery.json -> cards)

   This powers /gallery.html.
   Requirements:
   - Desktop: show 4 event cards (2x2)
   - Mobile: show only 2 event cards
   - Below: show a full-width (C5) link card to the root Google Drive folder
   - Rotate Drive event thumbnails every 5 seconds

   Important:
   - External events come from a Google Sheet (published as CSV) and are merged
     into data/gallery.json by update_gallery_json.py.
   - We use document.baseURI so this works on branch previews too.
   ========================================================= */

function galleryMaxCardsForWidth() {
  return window.matchMedia("(max-width: 980px)").matches ? 2 : 4;
}

function monthLabel(yyyyMm) {
  // Input: "YYYY-MM" -> Output: "Mon YYYY"
  if (typeof yyyyMm !== "string") return "";
  const m = yyyyMm.trim().match(/^([0-9]{4})-([0-9]{2})$/);
  if (!m) return "";
  const year = m[1];
  const month = m[2];
  const names = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
  };
  return `${names[month] || month} ${year}`;
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildGalleryCard({ title, photographer, note, href, thumbUrl, linkHint }) {
  const card = document.createElement("div");
  card.className = "gallery-card";

  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", `${title} (opens in a new tab)`);

  const img = document.createElement("img");
  img.className = "gallery-thumb";
  img.loading = "lazy";
  img.alt = title;
  img.src = thumbUrl;

  const body = document.createElement("div");
  body.className = "gallery-card-body";

  const h = document.createElement("div");
  h.className = "gallery-title";
  h.textContent = title;
  body.appendChild(h);

  if (photographer) {
    const credit = document.createElement("div");
    credit.className = "small";
    credit.style.marginTop = "6px";
    credit.style.color = "var(--muted)";
    credit.textContent = `Photo: ${photographer}`;
    body.appendChild(credit);
  }

  if (note) {
    const n = document.createElement("div");
    n.className = "small";
    n.style.marginTop = "6px";
    n.style.color = "var(--muted)";
    n.textContent = note;
    body.appendChild(n);
  }

  if (linkHint) {
    const hint = document.createElement("div");
    hint.className = "small";
    hint.style.marginTop = "10px";
    hint.style.color = "var(--muted)";
    hint.textContent = linkHint;
    body.appendChild(hint);
  }

  a.appendChild(img);
  a.appendChild(body);
  card.appendChild(a);

  return { card, imgEl: img };
}

async function loadGalleryPage() {
  const grid = document.getElementById("gallery-events-grid");
  const driveLinkRoot = document.getElementById("gallery-drive-link");
  const pastRoot = document.getElementById("gallery-past-events");

  // If we're not on /gallery.html, stop early.
  if (!grid) return;

  const setMessage = (el, msg) => {
    if (!el) return;
    el.innerHTML = `<div class="small">${msg}</div>`;
  };

  // Keep track of rotation timers so we can rerender on resize.
  // (We clear them before rebuilding the grid.)
  let rotationTimers = [];
  const clearRotationTimers = () => {
    rotationTimers.forEach((t) => clearInterval(t));
    rotationTimers = [];
  };

  try {
    // Build an absolute URL for the default thumbnail that works on branch previews.
    const defaultThumb = new URL("assets/icon.png", document.baseURI).toString();

    const jsonUrl = new URL("data/gallery.json", document.baseURI);
    jsonUrl.searchParams.set("_ts", String(Date.now()));
    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
      setMessage(grid, "Gallery temporarily unavailable.");
      return;
    }

    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const rootFolderUrl = data?.root_folder?.url || (data?.folder_id ? `https://drive.google.com/drive/folders/${data.folder_id}` : "");

    if (events.length === 0) {
      setMessage(grid, "No events loaded yet. Check back soon.");
      return;
    }

    // Split “recent 4” vs “past” based on the spec.
    const recent4 = events.slice(0, 4);
    const past = events.slice(4);

    const render = () => {
      clearRotationTimers();
      grid.innerHTML = "";
      if (pastRoot) pastRoot.innerHTML = "";
      if (driveLinkRoot) driveLinkRoot.innerHTML = "";

      // Desktop shows 4, mobile shows 2.
      const maxCards = galleryMaxCardsForWidth();
      const toShow = recent4.slice(0, maxCards);

      toShow.forEach((ev) => {
        const type = ev?.type;
        const title = (ev?.title || "Event").trim();
        // const label = monthLabel(ev?.month);

        const photographer = (ev?.photographer || "").trim();
        const note = (ev?.note || "").trim();

        if (type === "drive") {
          const folderUrl = (ev?.folder_url || "").trim();
          const imgs = Array.isArray(ev?.images) ? ev.images : [];
          const first = pickRandom(imgs);
          const thumbUrl = (first && typeof first.url === "string") ? first.url : defaultThumb;

          const built = buildGalleryCard({
            title,
            // label,
            photographer,
            note,
            href: folderUrl || rootFolderUrl || "#",
            thumbUrl,
            linkHint: "Google Drive folder",
          });
          grid.appendChild(built.card);

          // Rotate thumbnails every 5 seconds.
          // (Only if there is more than 1 image.)
          if (imgs.length > 1) {
            const timer = setInterval(() => {
              const next = pickRandom(imgs);
              const nextUrl = (next && typeof next.url === "string") ? next.url : "";
              if (!nextUrl) return;

              // Small fade for nicer swaps.
              built.imgEl.style.opacity = "0.15";
              setTimeout(() => {
                built.imgEl.src = nextUrl;
                built.imgEl.style.opacity = "1";
              }, 180);
            }, 5000);
            rotationTimers.push(timer);
          }
        } else {
          // External event
          const url = (ev?.url || "").trim();
          const thumbUrl = (ev?.thumb_url || "").trim() || defaultThumb;

          const built = buildGalleryCard({
            title,
            // label,
            photographer,
            note,
            href: url || "#",
            thumbUrl,
            linkHint: "External link",
          });
        }
      });

      // C5 full-width Drive link card
      if (driveLinkRoot && rootFolderUrl) {
        const a = document.createElement("a");
        a.className = "gallery-drive-link";
        a.href = rootFolderUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `
          <div style="font-weight:700; margin-bottom:6px;">Open the full shared Google Drive folder</div>
          <div class="small" style="color: var(--muted);">See all events, all photos, and download originals.</div>
        `;
        driveLinkRoot.appendChild(a);
      }

      // Past list (always based on the remaining events beyond the top 4)
      if (pastRoot) {
        if (past.length === 0) {
          setMessage(pastRoot, "No past events yet.");
        } else {
          past.forEach((ev) => {
            const type = ev?.type;
            const title = (ev?.title || "Event").trim();
            // const label = monthLabel(ev?.month);
            const href = type === "drive" ? (ev?.folder_url || rootFolderUrl) : (ev?.url || "#");

            const a = document.createElement("a");
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener";
            // a.textContent = label ? `${label} • ${title}` : title;
            a.textContent = `${title}`;
            pastRoot.appendChild(a);
          });
        }
      }
    };

    // Initial render + rerender when crossing the breakpoint.
    render();

    let lastMax = galleryMaxCardsForWidth();
    window.addEventListener("resize", () => {
      const nextMax = galleryMaxCardsForWidth();
      if (nextMax !== lastMax) {
        lastMax = nextMax;
        render();
      }
    });
  } catch (e) {
    setMessage(grid, "Gallery temporarily unavailable.");
    console.error(e);
  }
}

// Run on every page load, but it no-ops unless #gallery-events-grid exists.
loadGalleryPage();

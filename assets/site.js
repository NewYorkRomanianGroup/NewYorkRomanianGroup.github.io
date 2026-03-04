/**
 * NYRG site.js (collaborator-friendly)
 *
 * This file contains the client-side rendering for:
 * - Instagram embeds (from data/instagram.json)
 * - Gallery cards (from data/gallery.json)
 * - Jobs board (from data/jobs.json)
 *
 * IMPORTANT:
 * - Do not rename DOM element IDs referenced here unless you update BOTH:
 *   1) the page HTML (index.md, gallery.md, jobs.md), and
 *   2) the corresponding querySelector/getElementById calls here.
 *
 * Branch previews:
 * - In previews, the site is served under /<branch-name>/.
 * - Use Liquid | relative_url for internal asset links in HTML layouts.
 * - In JS, we compute a base prefix from <base> tags or window.__NYRG_BASEURL if present.
 *
 * If something looks broken:
 * - open DevTools Console
 * - search for "NYRG" logs
 */

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

// Randomize an array in-place (Fisher-Yates).
// We use this to randomize Featured Photos on each page load.
function shuffleInPlace(arr) {
  if (!Array.isArray(arr)) return arr;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// On the homepage, Instagram and Photo Highlights used to sit in a 2-column grid.
// We are removing Photo Highlights from the landing page, but keeping this code
// around so it is easy to restore later.
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
//
// IMPORTANT CHANGE:
// - We keep the function (so restoring Photo Highlights is easy later).
// - If Photo Highlights does not exist (because you removed it from index.md),
//   we only toggle Featured Photos.
function setPhotosVisibility({ show }) {
  const featuredCard = document.getElementById("featured-photos-card");
  const highlightsCard = document.getElementById("photo-highlights-card"); // may not exist anymore

  if (show) {
    setHidden(featuredCard, false);

    // Photo Highlights is removed from landing page right now.
    // Keep this line for easy restore later.
    if (highlightsCard) setHidden(highlightsCard, false);

    // If Photo Highlights is not present, we keep a single-column layout.
    setHomeGridSingleColumn(!highlightsCard);
  } else {
    setHidden(featuredCard, true);

    // Keep for easy restore later
    if (highlightsCard) setHidden(highlightsCard, true);

    setHomeGridSingleColumn(true);
  }
}



// =========================================================
// Instagram helpers
// =========================================================
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

    // You asked to remove this label, keep it blank.
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

    // Build fallback links (currently configured to hide these in CSS).
    if (fallback) {
      fallback.innerHTML = urls
        .map(() => "")
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
  if (!slidesRoot || !imgEl) return;

  // Knobs you can adjust:
  const PER_EVENT_PICK = 5;      // 5 photos per event per deck
  const MAX_EVENTS_USED = 50;    // safety cap

  try {
    const jsonUrl = new URL("data/gallery.json", document.baseURI);
    jsonUrl.searchParams.set("_ts", String(Date.now()));

    const res = await fetch(jsonUrl.toString(), { cache: "no-store" });

    // If gallery.json fails to load, treat it as "no accessible photos".
    if (!res.ok) {
      setPhotosVisibility({ show: false });
      return;
    }

    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];

    // Helper: normalize images into a consistent shape
    const shapeImage = (img, caption) => ({
      url: img && typeof img.url === "string" ? img.url.trim() : "",
      caption: typeof caption === "string" && caption.trim() ? caption.trim() : "Featured photo",
      webViewLink: img && typeof img.webViewLink === "string" ? img.webViewLink.trim() : ""
    });

    // Fisher-Yates shuffle
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    };

    // Build per-event pools
    const pools = events
      .map((ev) => {
        const title = typeof ev?.title === "string" ? ev.title.trim() : "Event";
        const imgs = Array.isArray(ev?.images) ? ev.images : [];

        // Shape + remove empties
        const shaped = imgs.map((img) => shapeImage(img, title)).filter((x) => x.url);

        // Deduplicate within event by URL
        const seen = new Set();
        const deduped = shaped.filter((x) => {
          if (seen.has(x.url)) return false;
          seen.add(x.url);
          return true;
        });

        if (deduped.length === 0) return null;

        return {
          title,
          all: deduped.slice(),
          remaining: shuffle(deduped.slice())
        };
      })
      .filter(Boolean)
      .slice(0, MAX_EVENTS_USED);

    // If there are no usable images, hide both photo cards and let Instagram fill the width.
    if (pools.length === 0) {
      setPhotosVisibility({ show: false });
      return;
    }

    setPhotosVisibility({ show: true });

    // Take N from an event pool without replacement.
    // If the pool is exhausted, reshuffle that event and continue.
    const takeNFromPool = (pool, n) => {
      const out = [];
      while (out.length < n) {
        if (!pool.remaining || pool.remaining.length === 0) {
          pool.remaining = shuffle(pool.all.slice());
          if (pool.remaining.length === 0) break;
        }
        out.push(pool.remaining.shift());
      }
      return out;
    };

    // Build one deck:
    //  - 5 per event from remaining
    //  - then shuffle deck so order is random within the deck
    const buildNextDeck = () => {
      const deck = [];
      pools.forEach((p) => deck.push(...takeNFromPool(p, PER_EVENT_PICK)));

      // Deduplicate across deck just in case (cheap insurance)
      const seen = new Set();
      const deduped = deck.filter((x) => {
        if (!x || !x.url) return false;
        if (seen.has(x.url)) return false;
        seen.add(x.url);
        return true;
      });

      return shuffle(deduped);
    };

    // Render a deck into the hidden slides container.
    const renderDeckToDOM = (deck) => {
      slidesRoot.innerHTML = "";
      deck.forEach((s) => {
        const d = document.createElement("div");
        d.setAttribute("data-image-url", s.url);
        d.setAttribute("data-caption", s.caption || "Featured photo");
        slidesRoot.appendChild(d);
      });

      // Prime hero image
      if (deck.length > 0) {
        if (captionEl) captionEl.textContent = deck[0].caption || "Featured photo";
        imgEl.src = deck[0].url;
        imgEl.alt = deck[0].caption || "Featured photo";
      }
    };

    // Store state globally so loadHeroRotator can refresh the deck on wrap.
    window.__NYRG_HERO_DECK_STATE = {
      buildNextDeck,
      renderDeckToDOM
    };

    // Initial deck
    const firstDeck = buildNextDeck();
    if (!firstDeck || firstDeck.length === 0) {
      setPhotosVisibility({ show: false });
      return;
    }
    renderDeckToDOM(firstDeck);
  } catch (e) {
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

  const state = window.__NYRG_HERO_DECK_STATE || null;

  const readSlidesFromDOM = () =>
    Array.from(slidesRoot.children)
      .map((el) => ({
        url: (el.getAttribute("data-image-url") || "").trim(),
        caption: (el.getAttribute("data-caption") || "").trim()
      }))
      .filter((s) => s.url);

  let slides = readSlidesFromDOM();
  if (slides.length === 0) return;

  let idx = 0;

  const render = () => {
    const active = slides[idx];
    imgEl.src = active.url;
    imgEl.alt = active.caption || "Featured photo";
    if (captionEl) captionEl.textContent = active.caption || "Featured photo";
  };

  // Refresh the whole deck, using the unused photos remaining per event.
  const refreshDeck = () => {
    if (!state || typeof state.buildNextDeck !== "function" || typeof state.renderDeckToDOM !== "function") {
      return false;
    }

    const deck = state.buildNextDeck();
    if (!deck || deck.length === 0) return false;

    state.renderDeckToDOM(deck);
    slides = readSlidesFromDOM();
    idx = 0;
    render();
    return true;
  };

  const move = (step) => {
    if (slides.length === 0) return;

    const oldIdx = idx;
    idx = (idx + step + slides.length) % slides.length;

    // If we wrapped forward (end -> start), refresh the deck now.
    const wrappedForward = step > 0 && oldIdx === slides.length - 1 && idx === 0;
    if (wrappedForward) {
      const ok = refreshDeck();
      if (ok) return;
    }

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
 * You asked to remove Photo Highlights from the landing page,
 * but keep this code around so it is easy to restore later.
 *
 * Right now we disable this behavior because:
 * - photo-highlights-card will not exist on landing page
 * - we do not want Drive iframe login heuristics to hide Featured Photos
 */
// function hideIfDriveRequiresLogin() {
//   const highlightsCard = document.getElementById("photo-highlights-card");
//   if (!highlightsCard) return;
//
//   const iframe = highlightsCard.querySelector("iframe");
//   if (!iframe) return;
//
//   let loaded = false;
//
//   // If iframe loads successfully.
//   iframe.addEventListener("load", () => {
//     loaded = true;
//
//     // Give it a small delay to render.
//     setTimeout(() => {
//       try {
//         // Heuristic: a blocked or login view sometimes results in a small iframe.
//         // If this trips in your testing, raise the threshold slightly.
//         if (iframe.offsetHeight < 200) {
//           setPhotosVisibility({ show: false });
//         }
//       } catch (e) {
//         // Any weirdness: hide photos.
//         setPhotosVisibility({ show: false });
//       }
//     }, 500);
//   });
//
//   // If nothing loads within 3 seconds, assume login wall or blocked embed.
//   setTimeout(() => {
//     if (!loaded) {
//       setPhotosVisibility({ show: false });
//     }
//   }, 3000);
// }
//
// document.addEventListener("DOMContentLoaded", hideIfDriveRequiresLogin);

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



// =========================================================
// Gallery renderer
// =========================================================
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

  // We use a single round-robin timeout so only 1 thumbnail changes at a time.
  let rotationTimeout = null;
  const clearRotationTimer = () => {
    if (rotationTimeout) clearTimeout(rotationTimeout);
    rotationTimeout = null;
  };

  // Desktop: 2000ms per swap, Mobile: 3000ms per swap
  function galleryThumbStepMs() {
    return window.matchMedia("(max-width: 980px)").matches ? 3000 : 2000;
  }

  // Pick a new image URL, trying to avoid repeating the current image.
  function pickNextUrl(imgs, currentUrl) {
    if (!Array.isArray(imgs) || imgs.length === 0) return "";

    const urls = imgs
      .map((x) => (x && typeof x.url === "string" ? x.url : ""))
      .filter(Boolean);

    if (urls.length === 0) return "";
    if (urls.length === 1) return urls[0];

    // Try a few random picks that differ from the current URL
    for (let k = 0; k < 6; k++) {
      const candidate = urls[Math.floor(Math.random() * urls.length)];
      if (candidate && candidate !== currentUrl) return candidate;
    }

    // Fallback: first different
    for (let i = 0; i < urls.length; i++) {
      if (urls[i] !== currentUrl) return urls[i];
    }

    return urls[0];
  }

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
    const rootFolderUrl =
      data?.root_folder?.url ||
      (data?.folder_id ? `https://drive.google.com/drive/folders/${data.folder_id}` : "");

    if (events.length === 0) {
      setMessage(grid, "No events loaded yet. Check back soon.");
      return;
    }

    // Split “recent 4” vs “past” based on the spec.
    const recent4 = events.slice(0, 4);
    const past = events.slice(4);

    const render = () => {
      clearRotationTimer();
      grid.innerHTML = "";
      if (pastRoot) pastRoot.innerHTML = "";
      if (driveLinkRoot) driveLinkRoot.innerHTML = "";

      // Desktop shows 4, mobile shows 2.
      const maxCards = galleryMaxCardsForWidth();
      const toShow = recent4.slice(0, maxCards);

      // Track the visible Drive cards that can rotate thumbnails.
      // We will rotate these 1 at a time in a round-robin loop.
      const rotatables = [];

      toShow.forEach((ev) => {
        const type = ev?.type;
        const title = (ev?.title || "Event").trim();

        const photographer = (ev?.photographer || "").trim();
        const note = (ev?.note || "").trim();

        if (type === "drive") {
          const folderUrl = (ev?.folder_url || "").trim();
          const imgs = Array.isArray(ev?.images) ? ev.images : [];

          const first = pickRandom(imgs);
          const initialUrl = (first && typeof first.url === "string") ? first.url : defaultThumb;

          const built = buildGalleryCard({
            title,
            photographer,
            note,
            href: folderUrl || rootFolderUrl || "#",
            thumbUrl: initialUrl,
            linkHint: "Google Drive folder",
          });

          grid.appendChild(built.card);

          // Only rotate if there are 2+ images
          if (imgs.length > 1) {
            rotatables.push({
              imgEl: built.imgEl,
              imgs,
              currentUrl: initialUrl,
            });
          }
        } else {
          // External event
          const url = (ev?.url || "").trim();
          const thumbUrl = (ev?.thumb_url || "").trim() || defaultThumb;

          const built = buildGalleryCard({
            title,
            photographer,
            note,
            href: url || "#",
            thumbUrl,
            linkHint: "External link",
          });

          grid.appendChild(built.card);
        }
      });

      // Round-robin thumbnail rotation:
      // - Desktop: 1 card changes every 2s
      // - Mobile: 1 card changes every 3s
      // - Initial delay: first change happens after stepMs (not immediately)
      if (rotatables.length > 0) {
        const stepMs = galleryThumbStepMs();
        const initialDelayMs = stepMs;

        let slot = 0;

        const tick = () => {
          // If the viewport changed since we started, we re-render anyway on breakpoint changes.
          // But this keeps timing correct even without a rerender.
          const liveStepMs = galleryThumbStepMs();

          const r = rotatables[slot];
          slot = (slot + 1) % rotatables.length;

          const nextUrl = pickNextUrl(r.imgs, r.currentUrl);
          if (nextUrl && nextUrl !== r.currentUrl) {
            r.imgEl.style.opacity = "0.15";
            setTimeout(() => {
              r.imgEl.src = nextUrl;
              r.imgEl.style.opacity = "1";
              r.currentUrl = nextUrl;
            }, 180);
          }

          rotationTimeout = setTimeout(tick, liveStepMs);
        };

        rotationTimeout = setTimeout(tick, initialDelayMs);
      }

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

      // Past list
      // On desktop: past = events beyond the top 4 (or 2 on mobile)
      // On mobile: also include the "hidden" recent cards (the ones we did not render)
      if (pastRoot) {
        const hiddenRecent = recent4.slice(maxCards);
        const pastList = hiddenRecent.concat(past);

        if (pastList.length === 0) {
          setMessage(pastRoot, "No past events yet.");
        } else {
          pastList.forEach((ev) => {
            const type = ev?.type;
            const title = (ev?.title || "Event").trim();
            const href =
              type === "drive"
                ? (ev?.folder_url || rootFolderUrl)
                : (ev?.url || "#");

            const a = document.createElement("a");
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener";
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

/**
 * ============================
 * JOBS PAGE LOADER (Job Board)
 * ============================
 *
 * Features:
 * - Nearest deadline first, then rolling
 * - Filters: search, location, type, company
 * - Sort dropdown
 * - "Submit a job" button (Google Form)
 * - Works with branch previews via window.__NYRG_BASEURL
 *
 * Notes for collaborators:
 * - The Python script decides which jobs are open and writes data/jobs.json
 * - This JS only handles display, sorting, and filtering
 */

function _nyrgBaseurl() {
  // Jekyll baseurl is "" on main, "/branch-name" on previews
  return (window.__NYRG_BASEURL || "").replace(/\/+$/, "");
}

function _setJobsSubmitLinks() {
  const url = window.__NYRG_JOBS_SUBMIT_URL || "";
  const a1 = document.getElementById("jobs-submit-btn");
  const a2 = document.getElementById("jobs-submit-btn-empty");

  // If no URL is set, hide the button(s) so we do not show a dead link
  [a1, a2].forEach(a => {
    if (!a) return;
    if (!url) {
      a.style.display = "none";
    } else {
      a.href = url;
      a.style.display = "inline-flex";
    }
  });
}

function _norm(s) {
  return (s || "").toString().trim();
}

function _keyLower(s) {
  return _norm(s).toLowerCase();
}

function _parseDeadlineToDate(job) {
  // Prefer deadline_iso if present (YYYY-MM-DD), otherwise try deadline string
  const iso = _norm(job.deadline_iso) || _norm(job.deadline);
  if (!iso) return null;

  // Try YYYY-MM-DD first
  const m1 = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m1) {
    const d = new Date(Date.UTC(+m1[1], +m1[2] - 1, +m1[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Try MM/DD/YYYY
  const m2 = iso.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const d = new Date(Date.UTC(+m2[3], +m2[1] - 1, +m2[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function _jobHasDeadline(job) {
  return !!_parseDeadlineToDate(job);
}

function _deadlineSortKey(job) {
  // For sorting: deadline jobs first. Rolling gets a large key.
  const d = _parseDeadlineToDate(job);
  if (!d) return Number.POSITIVE_INFINITY;
  return d.getTime();
}

function _compareAZ(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function _uniqueSorted(values) {
  const set = new Set(values.filter(v => v));
  return Array.from(set).sort((a, b) => _compareAZ(a, b));
}

function _populateSelect(selectEl, values) {
  if (!selectEl) return;
  const cur = selectEl.value;

  // Keep first option, then rebuild others
  const first = selectEl.querySelector("option");
  selectEl.innerHTML = "";
  if (first) selectEl.appendChild(first);

  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });

  // Restore selection if possible
  selectEl.value = cur;
}

function _renderJobs(grid, jobs) {
  grid.innerHTML = "";

  jobs.forEach(job => {
    const title = _norm(job.title);
    const company = _norm(job.company);
    const location = _norm(job.location);
    const type = _norm(job.type);
    const applyUrl = _norm(job.apply_url || job.url || job.apply);
    const note = _norm(job.note || job.notes);
    const description = _norm(job.description);

    const deadlineDate = _parseDeadlineToDate(job);
    const deadlineLabel = deadlineDate
      ? (job.deadline || job.deadline_iso || "").toString()
      : "Rolling";

    const card = document.createElement("div");
    card.className = "job-card";

    // ----- Top row (title + pill) -----
    const top = document.createElement("div");
    top.className = "job-top";

    const titleEl = document.createElement("div");
    titleEl.className = "job-title";
    titleEl.textContent = title || "Untitled role";

    top.appendChild(titleEl);

    if (type) {
      const pill = document.createElement("div");
      pill.className = "job-pill";
      pill.textContent = type;
      top.appendChild(pill);
    }

    card.appendChild(top);

    // ----- Company -----
    if (company) {
      const c = document.createElement("div");
      c.className = "job-company";
      c.textContent = company;
      card.appendChild(c);
    }

    // ----- Meta (location + deadline) -----
    const meta = document.createElement("div");
    meta.className = "job-meta";

    if (location) {
      const m1 = document.createElement("span");
      m1.className = "job-meta-item";
      m1.textContent = location;
      meta.appendChild(m1);
    }

    const m2 = document.createElement("span");
    m2.className = "job-meta-item";
    m2.textContent = deadlineDate ? `Apply by: ${deadlineLabel}` : "Rolling applications";
    meta.appendChild(m2);

    card.appendChild(meta);

    // ----- Note -----
    if (note) {
      const n = document.createElement("div");
      n.className = "job-note";
      n.textContent = note;
      card.appendChild(n);
    }

    // ----- Collapsible Description (your CSS already supports .job-desc / .job-desc-text) -----
    if (description) {
      const descWrap = document.createElement("div");
      descWrap.className = "job-desc";

      const details = document.createElement("details");

      const summary = document.createElement("summary");
      summary.textContent = "Details";

      const body = document.createElement("div");
      body.className = "job-desc-text";
      body.textContent = description;

      details.appendChild(summary);
      details.appendChild(body);
      descWrap.appendChild(details);
      card.appendChild(descWrap);
    }

    // ----- Apply link -----
    if (applyUrl) {
      const actions = document.createElement("div");
      actions.className = "job-actions";

      const a = document.createElement("a");
      a.className = "job-apply";
      a.textContent = "View / Apply";
      a.target = "_blank";
      a.rel = "noopener";

      // Best-effort: accept absolute http(s) and mailto.
      // If someone pastes "www....", prepend https://
      let href = applyUrl;
      if (/^mailto:/i.test(href)) {
        // ok
      } else if (!/^https?:\/\//i.test(href)) {
        href = "https://" + href.replace(/^\/+/, "");
      }
      a.href = href;

      actions.appendChild(a);
      card.appendChild(actions);
    }

    grid.appendChild(card);
  });
}



// =========================================================
// Jobs renderer
// =========================================================
async function loadJobsPage() {
  const grid = document.getElementById("jobs-grid");
  const empty = document.getElementById("jobs-empty");
  const board = document.getElementById("jobs-board");
  const countEl = document.getElementById("jobs-count");

  const searchEl = document.getElementById("jobs-search");
  const locEl = document.getElementById("jobs-filter-location");
  const compEl = document.getElementById("jobs-filter-company");
  const sortEl = document.getElementById("jobs-sort");
  const clearBtn = document.getElementById("jobs-clear");

  _setJobsSubmitLinks();

  if (!grid) return;

  let allJobs = [];

  try {
    const url = `${_nyrgBaseurl()}/data/jobs.json`;
    const res = await fetch(url, { cache: "no-cache" });
    const data = await res.json();

    allJobs = Array.isArray(data.jobs) ? data.jobs : [];

    // If 0 jobs (already filtered by Python generator), show empty state
    if (allJobs.length === 0) {
      if (empty) empty.style.display = "block";
      if (board) board.style.display = "none";
      return;
    }

    if (empty) empty.style.display = "none";
    if (board) board.style.display = "block";

    // Build dropdown options from available jobs
    const locations = _uniqueSorted(allJobs.map(j => _norm(j.location)));
    const companies = _uniqueSorted(allJobs.map(j => _norm(j.company)));

    _populateSelect(locEl, locations);
    _populateSelect(compEl, companies);

    function applyFiltersAndRender() {
      const q = _keyLower(searchEl ? searchEl.value : "");
      const loc = _norm(locEl ? locEl.value : "");
      const comp = _norm(compEl ? compEl.value : "");
      const sortMode = _norm(sortEl ? sortEl.value : "deadline_soonest");

      let filtered = allJobs.slice();

      if (loc) filtered = filtered.filter(j => _norm(j.location) === loc);
      if (comp) filtered = filtered.filter(j => _norm(j.company) === comp);

      if (q) {
        filtered = filtered.filter(j => {
          // Keeping j.type in the search blob is optional, but it is handy even without a dropdown.
          const blob = [j.title, j.company, j.location, j.type, j.note].map(_keyLower).join(" ");
          return blob.includes(q);
        });
      }

      // Default sorting: deadline soonest first, then rolling
      if (sortMode === "deadline_soonest") {
        filtered.sort((a, b) => _deadlineSortKey(a) - _deadlineSortKey(b));
      } else if (sortMode === "deadline_latest") {
        filtered.sort((a, b) => _deadlineSortKey(b) - _deadlineSortKey(a));
      } else if (sortMode === "company_az") {
        filtered.sort((a, b) => _compareAZ(_keyLower(a.company), _keyLower(b.company)));
      } else if (sortMode === "title_az") {
        filtered.sort((a, b) => _compareAZ(_keyLower(a.title), _keyLower(b.title)));
      }

      // Update count text
      const total = allJobs.length;
      const shown = filtered.length;

      if (countEl) {
        if (shown === total) countEl.textContent = `${shown} open opportunity(s)`;
        else countEl.textContent = `${shown} shown (of ${total} open)`;
      }

      // If filters hide everything, show a friendly message inside the board
      if (shown === 0) {
        grid.innerHTML = `<div class="jobs-no-results">No matches. Try clearing filters.</div>`;
        return;
      }

      _renderJobs(grid, filtered);
    }

    // Hook controls
    const rerender = () => applyFiltersAndRender();

    if (searchEl) searchEl.addEventListener("input", rerender);
    if (locEl) locEl.addEventListener("change", rerender);
    if (compEl) compEl.addEventListener("change", rerender);
    if (sortEl) sortEl.addEventListener("change", rerender);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchEl) searchEl.value = "";
        if (locEl) locEl.value = "";
        if (compEl) compEl.value = "";
        if (sortEl) sortEl.value = "deadline_soonest";
        applyFiltersAndRender();
      });
    }

    // Initial render
    applyFiltersAndRender();

  } catch (err) {
    console.error(err);
    if (empty) empty.style.display = "block";
    if (board) board.style.display = "none";
  }
}
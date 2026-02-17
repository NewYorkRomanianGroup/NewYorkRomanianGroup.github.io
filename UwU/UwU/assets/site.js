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
    // cache: "no-store" makes sure we always fetch the newest JSON.
    const res = await fetch("data/instagram.json", { cache: "no-store" });

    // If the file is missing or returns an error, show a friendly message.
    if (!res.ok) {
      setMessage(container, "Instagram feed temporarily unavailable.");
      if (fallback) fallback.innerHTML = "";
      return;
    }

    const data = await res.json();

    // Extract up to 3 URLs safely.
    const posts = Array.isArray(data?.posts) ? data.posts : [];
    const urls = posts
      .map((p) => (p && typeof p.url === "string" ? p.url.trim() : ""))
      .filter(Boolean)
      .slice(0, 3);

    // Show "updated at" label if present and valid.
    if (updatedEl && typeof data?.updated_at === "string") {
      const d = new Date(data.updated_at);
      updatedEl.textContent = isNaN(d.getTime()) ? "" : `Updated: ${d.toLocaleString()}`;
    } else if (updatedEl) {
      updatedEl.textContent = "";
    }

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

      // Keep layout consistent even before embeds load
      block.style.margin = "0 auto";
      block.style.maxWidth = "540px";
      block.style.minWidth = "280px";

      container.appendChild(block);
    });

    // Build fallback links (useful if embeds are blocked by privacy tools).
    if (fallback) {
      fallback.innerHTML = urls
        .map((u, i) => {
          const label = `Instagram post ${i + 1}`;
          return `<div><a href="${u}" target="_blank" rel="noopener">${label}</a></div>`;
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

loadHeroRotator();

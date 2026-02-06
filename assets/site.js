// Old
// // NYRG site.js
// // Keep this file small and easy for collaborators to edit.

// console.log("NYRG site loaded");



/**
 * Loads assets/instagram.json and injects 3 latest post embeds.
 * If embeds do not render (privacy blockers), we show clickable links.
 */

async function loadInstagramLatest() {
  const container = document.getElementById("insta-latest");
  const fallback = document.getElementById("insta-fallback-links");
  const updatedEl = document.getElementById("insta-updated-at");

  if (!container) return;

  try {
    const res = await fetch("assets/instagram.json", { cache: "no-store" });
    const data = await res.json();

    const posts = Array.isArray(data.posts) ? data.posts : [];
    const urls = posts.map((p) => p.url).filter(Boolean).slice(0, 3);

    if (updatedEl && data.updated_at) {
      const d = new Date(data.updated_at);
      updatedEl.textContent = isNaN(d.getTime()) ? "" : `Updated: ${d.toLocaleString()}`;
    }

    if (urls.length === 0) {
      container.innerHTML = `<div class="small">No posts loaded yet. Check back soon.</div>`;
      return;
    }

    // Build embeds
    container.innerHTML = "";
    urls.forEach((url) => {
      const block = document.createElement("blockquote");
      block.className = "instagram-media";
      block.setAttribute("data-instgrm-permalink", url);
      block.setAttribute("data-instgrm-version", "14");
      block.style.margin = "0 auto";
      block.style.maxWidth = "540px";
      block.style.minWidth = "280px";
      container.appendChild(block);
    });

    // Also build fallback links (useful if embeds are blocked)
    if (fallback) {
      fallback.innerHTML = urls
        .map((u) => `<div><a href="${u}" target="_blank" rel="noopener">${u}</a></div>`)
        .join("");
    }

    // Ensure Instagram embed script exists, then process embeds
    if (!document.getElementById("ig-embed-script")) {
      const s = document.createElement("script");
      s.id = "ig-embed-script";
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = () => {
        if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
      };
      document.body.appendChild(s);
    } else {
      if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
    }
  } catch (e) {
    container.innerHTML = `<div class="small">Instagram feed temporarily unavailable.</div>`;
    console.error(e);
  }
}

loadInstagramLatest();

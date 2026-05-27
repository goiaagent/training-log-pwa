export function renderReviews(root, state) {
  const daily = state.log.parsed.dailyReviewsRaw.trim();
  const weekly = state.log.parsed.weeklyReviewsRaw.trim();

  root.innerHTML = `
    <div class="reviews-toggle">
      <button data-tab="daily" class="active">Daily</button>
      <button data-tab="weekly">Weekly</button>
    </div>
    <div class="reviews-body">
      <div data-pane="daily">${daily ? renderMd(daily) : `<p class="empty">No reviews yet.</p>`}</div>
      <div data-pane="weekly" hidden>${weekly ? renderMd(weekly) : `<p class="empty">No weekly reviews yet.</p>`}</div>
    </div>
  `;

  root.querySelectorAll(".reviews-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const which = btn.dataset.tab;
      root.querySelectorAll(".reviews-toggle button").forEach((b) => b.classList.toggle("active", b === btn));
      root.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== which));
    });
  });
}

// Minimal markdown → HTML. Supports: ### headers, **bold**, - lists.
function renderMd(md) {
  const lines = md.split("\n");
  const out = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3>${escapeAndInline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h2>${escapeAndInline(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${escapeAndInline(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p>${escapeAndInline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function escapeAndInline(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

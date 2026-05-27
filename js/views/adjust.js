import { isAdjustmentActive } from "../prescribed.js";

export function renderAdjust(root, state) {
  const { adjustments, watchlist } = state.log.parsed;
  const today = new Date();
  const active = adjustments.filter((a) => isAdjustmentActive(a, today));
  const expired = adjustments.filter((a) => !isAdjustmentActive(a, today));

  root.innerHTML = `
    <section>
      <h2>Active Adjustments</h2>
      ${
        active.length
          ? `<ul class="adj-list">${active.map(renderAdj).join("")}</ul>`
          : `<p class="empty">None.</p>`
      }
    </section>
    <section>
      <h2>Watchlist</h2>
      ${
        watchlist.length
          ? `<ul class="adj-list">${watchlist
              .map((w) => `<li><strong>${esc(w.topic)}</strong><br><span>${esc(w.raw)}</span></li>`)
              .join("")}</ul>`
          : `<p class="empty">None.</p>`
      }
    </section>
    ${
      expired.length
        ? `<section>
            <h2>Recently expired</h2>
            <ul class="adj-list">${expired.map(renderAdj).join("")}</ul>
          </section>`
        : ""
    }
  `;
}

function renderAdj(a) {
  return `<li>
    <strong>${esc(a.key || "(unparseable)")}</strong>
    <div>${esc(a.raw)}</div>
    <div class="muted">${a.set ? `Set ${a.set}` : ""}${a.expire ? ` · expires ${a.expire}` : ""}</div>
  </li>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

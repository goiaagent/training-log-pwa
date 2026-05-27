export function renderLog(root, state) {
  const sessions = state.log.parsed.sessions;
  if (!sessions.length) {
    root.innerHTML = `<p class="empty">No sessions logged yet.</p>`;
    return;
  }
  const now = Date.now();
  root.innerHTML = `<div class="history">
    ${sessions
      .map((s, i) => {
        const editable = i === 0 && isWithin24h(s.date, now);
        return `
        <details class="history-row">
          <summary>
            <strong>${esc(s.date)} — ${esc(s.dayOfWeek)}</strong>
            <span class="muted">${esc(s.name)}</span>
            ${editable ? `<a class="edit-link" href="#/edit-recent">edit</a>` : ""}
          </summary>
          <div class="history-detail">
            <div class="muted">Phase ${s.phase} · Week ${s.week} · Sleep ${s.sleep_h}h · Mood ${s.mood}/5 · Body: ${esc(s.body || "—")}</div>
            <ul class="history-blocks">
              ${s.blocks
                .map(
                  (b) => `<li><strong>${esc(b.label)}. ${esc(b.exercise)}</strong>
                  <span class="muted">_(${esc(b.type)})_</span><br>
                  <code>${esc(stringifyEntry(b.entry))}</code>
                  ${b.entry.notes ? `<div class="block-notes">${esc(b.entry.notes)}</div>` : ""}
                  </li>`,
                )
                .join("")}
            </ul>
            ${s.globalNotes ? `<div class="block-notes"><em>${esc(s.globalNotes)}</em></div>` : ""}
          </div>
        </details>
        `;
      })
      .join("")}
  </div>`;
}

function isWithin24h(dateIso, now) {
  const d = new Date(dateIso + "T00:00:00").getTime();
  return now - d < 24 * 3600 * 1000;
}

function stringifyEntry(entry) {
  return Object.entries(entry)
    .filter(([k]) => k !== "notes")
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

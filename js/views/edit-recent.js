import { buildSessionMarkdown } from "../log-builder.js";
import { getSession } from "../program-index.js";
import { fieldsFor } from "../exercise-types.js";
import { getLogText, saveLogText } from "../storage.js";
import { parseLog } from "../log-parser.js";

export function renderEditRecent(root, state, { navigate }) {
  const recent = state.log.parsed.sessions[0];
  if (!recent) {
    root.innerHTML = `<p class="empty">No session to edit.</p>`;
    return;
  }
  const ageMs = Date.now() - new Date(recent.date + "T00:00:00").getTime();
  if (ageMs > 24 * 3600 * 1000) {
    root.innerHTML = `<p class="empty">Edit window (24h) has passed for this session.</p>`;
    return;
  }

  // Render an editable form pre-populated with the saved values.
  // Simplified: render each block as a flat form with its current values.
  root.innerHTML = `
    <section class="edit-form">
      <h2>Edit ${esc(recent.date)} — ${esc(recent.dayOfWeek)} — ${esc(recent.name)}</h2>

      <h3>Pre-session</h3>
      <label>Sleep (h) <input type="number" step="0.25" name="sleep_h" value="${recent.sleep_h || ""}"></label>
      <label>Mood <input type="number" name="mood" min="1" max="5" value="${recent.mood || ""}"></label>
      <label>Body <input type="text" name="body" value="${esc(recent.body || "")}"></label>

      ${recent.blocks
        .map(
          (b, idx) => `
        <h3>Block ${esc(b.label)} — ${esc(b.exercise)} <span class="muted">_(${esc(b.type)})_</span></h3>
        <div data-edit-block-idx="${idx}" data-edit-block-type="${esc(b.type)}">
          ${renderEntryFields(b)}
        </div>
      `,
        )
        .join("")}

      <label>Global notes <input type="text" name="global_notes" value="${esc(recent.globalNotes || "")}"></label>

      <button id="edit-save">Save edits</button>
      <div id="edit-status" class="muted"></div>
    </section>
  `;

  document.getElementById("edit-save").addEventListener("click", async () => {
    const btn = document.getElementById("edit-save");
    const status = document.getElementById("edit-status");
    btn.disabled = true;
    status.textContent = "Saving…";
    try {
      const newRecent = buildEditedSession(root, recent);
      await replaceRecentInLog(state, recent, newRecent);
      status.textContent = "✓ Saved";
      setTimeout(() => navigate("log"), 600);
    } catch (e) {
      status.textContent = `✗ ${e.message}`;
      btn.disabled = false;
    }
  });
}

function renderEntryFields(block) {
  const fields = fieldsFor(block.type);
  return fields
    .filter((f) => f.kind !== "attempts_list") // attempts editing skipped for v1
    .map((f) => {
      const v = block.entry[f.name];
      return `<label>${f.label}
        <input type="${f.kind === "integer" || f.kind === "number" || f.kind === "rpe" ? "number" : "text"}"
               name="${f.name}" value="${v !== undefined ? esc(String(v)) : ""}">
      </label>`;
    })
    .join("");
}

function buildEditedSession(root, recent) {
  const pre = {
    sleep_h: Number(root.querySelector('input[name="sleep_h"]').value) || 0,
    mood: Number(root.querySelector('input[name="mood"]').value) || 0,
    body: root.querySelector('input[name="body"]').value || "—",
  };
  const blocks = recent.blocks.map((b, idx) => {
    const wrap = root.querySelector(`[data-edit-block-idx="${idx}"]`);
    const entry = {};
    wrap.querySelectorAll("input").forEach((el) => {
      if (el.value !== "") entry[el.name] = isNumeric(el) ? Number(el.value) : el.value;
    });
    return { label: b.label, exercise: b.exercise, type: b.type, entry: { ...b.entry, ...entry } };
  });
  return {
    date: recent.date,
    dayOfWeek: recent.dayOfWeek,
    name: recent.name,
    phase: recent.phase,
    week: recent.week,
    sleep_h: pre.sleep_h,
    mood: pre.mood,
    body: pre.body,
    blocks,
    globalNotes: root.querySelector('input[name="global_notes"]').value || "",
  };
}

function isNumeric(input) {
  return input.type === "number";
}

async function replaceRecentInLog(state, oldSession, newSession) {
  let text = getLogText() || state.log.text;

  // Find and remove the existing block for that date+session name.
  const startMarker = `### ${oldSession.date} — ${oldSession.dayOfWeek} — ${oldSession.name}`;
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) throw new Error("Could not locate session block in log.md");
  // End is start of next ### or end of ## Sessions
  let endIdx = text.indexOf("\n### ", startIdx + 1);
  if (endIdx === -1) endIdx = text.indexOf("\n## ", startIdx + 1);
  if (endIdx === -1) endIdx = text.length;
  text = text.slice(0, startIdx) + text.slice(endIdx).replace(/^\n/, "");

  // Insert the new block at the top of ## Sessions, with edit marker appended
  const newMd = buildSessionMarkdown(newSession) + `\n_(edited ${new Date().toISOString().slice(0, 16).replace("T", " ")})_\n`;
  const sessIdx = text.indexOf("## Sessions");
  const afterHeader = text.indexOf("\n", sessIdx) + 1;
  const merged = text.slice(0, afterHeader) + "\n" + newMd.trim() + "\n" + text.slice(afterHeader);
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  const final = merged.replace(/\*\*Last updated:\*\*[^\n]*/, `**Last updated:** ${ts}`);

  saveLogText(final);
  state.log = { text: final, parsed: parseLog(final) };
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

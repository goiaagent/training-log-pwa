import { getSession, prescribedForBlock } from "../program-index.js";
import { fieldsFor, validateEntry } from "../exercise-types.js";
import { resolvePrescribed, isAdjustmentActive } from "../prescribed.js";
import { buildSessionMarkdown, insertSession } from "../log-builder.js";
import { writeFile, readFile } from "../drive.js";
import { getDraft, saveDraft, clearDraft } from "../storage.js";

export function renderToday(root, state, { reload }) {
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!state.day?.sessionKeys?.length) {
    root.innerHTML = `<p class="empty">No session today.</p>`;
    return;
  }

  // For phone simplicity: when there are multiple sessions on a day (Mon/Wed have AM+PM),
  // show them stacked, each independently saveable.
  const sessions = state.day.sessionKeys.map((key) => getSession(key));

  // Adjustments + watchlist banners
  const activeAdjustments = state.log.parsed.adjustments.filter((a) => isAdjustmentActive(a, today));
  const watchlist = state.log.parsed.watchlist;

  root.innerHTML = `
    ${renderBanners(activeAdjustments, watchlist)}
    ${renderPreSession(dateIso)}
    ${sessions
      .map((sess, i) => renderSession(sess, state.day, state.log.parsed.adjustments, today, dateIso, i))
      .join("")}
  `;

  // Restore drafts and wire input listeners
  wireForm(root, state, dateIso, sessions, reload);
}

function renderBanners(adjustments, watchlist) {
  if (!adjustments.length && !watchlist.length) return "";
  const parts = [];
  if (adjustments.length) {
    parts.push(`<h3>⚙ Active adjustments</h3><ul>${adjustments
      .map((a) => `<li><strong>${esc(a.key)}</strong>: ${esc(truncate(a.raw, 80))}</li>`)
      .join("")}</ul>`);
  }
  if (watchlist.length) {
    parts.push(`<h3>👁 Watchlist</h3><ul>${watchlist
      .map((w) => `<li><strong>${esc(w.topic)}</strong>: ${esc(truncate(w.raw, 80))}</li>`)
      .join("")}</ul>`);
  }
  return `<div class="banner">${parts.join("")}</div>`;
}

function renderPreSession(dateIso) {
  return `
    <section class="pre-session" data-date="${dateIso}">
      <h2>Pre-session</h2>
      <label>Sleep prev night (h)
        <input type="number" step="0.25" name="sleep_h" inputmode="decimal">
      </label>
      <label>Mood
        ${rpeButtons("mood", 5)}
      </label>
      <label>Soreness
        ${rpeButtons("soreness", 5)}
      </label>
      <label>Body notes
        <input type="text" name="body" placeholder="e.g. quads sore, R shoulder tight">
      </label>
    </section>
  `;
}

function renderSession(sess, day, adjustments, today, dateIso, idx) {
  return `
    <section class="session" data-session-idx="${idx}" data-session-name="${esc(sess.name)}">
      <h2>${esc(sess.name)}</h2>
      <div class="muted">~${sess.duration_min} min</div>
      ${sess.blocks
        .map((block, bi) => renderBlock(block, day.phase, adjustments, today, idx, bi))
        .join("")}
      <button class="save-btn" data-action="save" data-session-idx="${idx}">Save session to Drive</button>
      <div class="save-status" data-status-for="${idx}"></div>
    </section>
  `;
}

function renderBlock(block, phase, adjustments, today, sessIdx, blockIdx) {
  const { values: prescribed, overrides } = resolvePrescribed(block, phase, adjustments, today);
  const fields = fieldsFor(block.type);
  const overrideLabels = overrides.map((o) => `${o.field}→${o.value}`).join(", ");
  return `
    <details class="block" data-session-idx="${sessIdx}" data-block-idx="${blockIdx}" data-type="${block.type}" data-block-id="${block.id}">
      <summary>
        <span class="block-name">${esc(block.name)}</span>
        <span class="block-prescribed">${esc(prescribedSummary(prescribed))}</span>
        ${overrides.length ? `<span class="block-override">⚙ ${esc(overrideLabels)}</span>` : ""}
      </summary>
      <div class="block-form">
        ${fields.map((f) => renderField(f, prescribed[f.name])).join("")}
        <button type="button" class="skip-btn" data-action="skip">Mark skipped</button>
      </div>
    </details>
  `;
}

function prescribedSummary(values) {
  return Object.entries(values)
    .filter(([k]) => k !== "notes")
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(" · ");
}

function renderField(field, prescribedValue) {
  const name = field.name;
  const label = field.label + (field.required ? "" : " (optional)");
  const ph = prescribedValue !== undefined ? `placeholder="${esc(String(prescribedValue))}"` : "";

  if (field.kind === "rpe") {
    return `<label class="field">${label}${rpeButtons(name, 10)}</label>`;
  }
  if (field.kind === "enum") {
    return `<label class="field">${label}
      <select name="${name}">
        <option value="">—</option>
        ${field.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}
      </select>
    </label>`;
  }
  if (field.kind === "text") {
    return `<label class="field">${label}<input type="text" name="${name}" ${ph}></label>`;
  }
  if (field.kind === "attempts_list") {
    return `<div class="field" data-field="attempts">
      <span class="field-label">${label}</span>
      <div class="attempts-list"></div>
      <button type="button" class="add-attempt">+ Add attempt</button>
    </div>`;
  }
  const inputType = field.kind === "integer" || field.kind === "number" ? "number" : "text";
  const step = field.kind === "number" ? "0.5" : "1";
  return `<label class="field">${label}
    <input type="${inputType}" step="${step}" inputmode="${inputType === "number" ? "decimal" : "text"}" name="${name}" ${ph}>
  </label>`;
}

function rpeButtons(name, max) {
  return `<div class="rpe-buttons" data-rpe-name="${name}">
    ${Array.from({ length: max }, (_, i) => i + 1)
      .map((n) => `<button type="button" data-rpe-value="${n}" data-rpe-target="${name}">${n}</button>`)
      .join("")}
  </div>`;
}

function wireForm(root, state, dateIso, sessions, reload) {
  // Hydrate from draft
  const draft = getDraft(dateIso);
  if (draft) hydrateDraft(root, draft);

  // RPE button selection
  root.querySelectorAll(".rpe-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.rpeTarget;
      const group = btn.parentElement;
      group.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      group.dataset.value = btn.dataset.rpeValue;
      persistDraft();
    });
  });

  // Attempts list (climbing_project)
  root.querySelectorAll(".add-attempt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = btn.previousElementSibling;
      const row = document.createElement("div");
      row.className = "attempt-row";
      row.innerHTML = `
        <input type="text" placeholder="Grade (7c)" data-attempt="grade">
        <input type="text" placeholder="Route" data-attempt="route_name">
        <select data-attempt="result">
          <option value="flash">flash</option>
          <option value="send">send</option>
          <option value="fell">fell</option>
          <option value="dab">dab</option>
        </select>
        <input type="number" placeholder="Burn#" data-attempt="burn_number" inputmode="numeric">
        <input type="text" placeholder="Notes" data-attempt="notes">
        <button type="button" data-action="remove-attempt">×</button>
      `;
      list.appendChild(row);
      persistDraft();
    });
  });

  root.addEventListener("click", (e) => {
    if (e.target.dataset.action === "remove-attempt") {
      e.target.closest(".attempt-row").remove();
      persistDraft();
    }
    if (e.target.dataset.action === "skip") {
      const block = e.target.closest(".block");
      block.dataset.skipped = "true";
      block.querySelectorAll("input, select").forEach((el) => (el.disabled = true));
      e.target.textContent = "Skipped — tap to unskip";
      e.target.dataset.action = "unskip";
      persistDraft();
    } else if (e.target.dataset.action === "unskip") {
      const block = e.target.closest(".block");
      delete block.dataset.skipped;
      block.querySelectorAll("input, select").forEach((el) => (el.disabled = false));
      e.target.textContent = "Mark skipped";
      e.target.dataset.action = "skip";
      persistDraft();
    }
  });

  // Persist any input change
  root.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", persistDraft);
  });

  // Save buttons
  root.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sessIdx = Number(btn.dataset.sessionIdx);
      btn.disabled = true;
      const status = root.querySelector(`[data-status-for="${sessIdx}"]`);
      status.textContent = "Saving…";
      try {
        await saveSession(state, dateIso, sessions[sessIdx], sessIdx, root);
        status.textContent = `✓ Saved · ${timeNow()}`;
        clearDraft(dateIso);
        setTimeout(reload, 800);
      } catch (err) {
        status.textContent = `✗ ${err.message}`;
        btn.disabled = false;
      }
    });
  });

  function persistDraft() {
    saveDraft(dateIso, extractDraft(root));
  }
}

function extractDraft(root) {
  const draft = { pre: {}, sessions: [] };
  root.querySelectorAll(".pre-session input").forEach((el) => {
    draft.pre[el.name] = el.value;
  });
  root.querySelectorAll(".pre-session .rpe-buttons").forEach((g) => {
    draft.pre[g.dataset.rpeName] = g.dataset.value || null;
  });

  root.querySelectorAll(".session").forEach((sessEl) => {
    const sIdx = Number(sessEl.dataset.sessionIdx);
    const sess = { blocks: [] };
    sessEl.querySelectorAll(".block").forEach((b) => {
      const bIdx = Number(b.dataset.blockIdx);
      const entry = {};
      const skipped = b.dataset.skipped === "true";
      b.querySelectorAll("input, select").forEach((el) => {
        if (el.name && el.value !== "") entry[el.name] = el.value;
      });
      b.querySelectorAll(".rpe-buttons").forEach((g) => {
        if (g.dataset.value) entry[g.dataset.rpeName] = Number(g.dataset.value);
      });
      // attempts list
      const attempts = [];
      b.querySelectorAll(".attempt-row").forEach((row) => {
        const a = {};
        row.querySelectorAll("[data-attempt]").forEach((el) => {
          if (el.value !== "") a[el.dataset.attempt] = isNumericField(el.dataset.attempt) ? Number(el.value) : el.value;
        });
        if (Object.keys(a).length) attempts.push(a);
      });
      if (attempts.length) entry.attempts = attempts;
      sess.blocks[bIdx] = { entry, skipped };
    });
    draft.sessions[sIdx] = sess;
  });
  return draft;
}

function isNumericField(name) {
  return name === "burn_number";
}

function hydrateDraft(root, draft) {
  if (draft.pre) {
    for (const [k, v] of Object.entries(draft.pre)) {
      const input = root.querySelector(`.pre-session input[name="${k}"]`);
      if (input) input.value = v;
      const group = root.querySelector(`.pre-session .rpe-buttons[data-rpe-name="${k}"]`);
      if (group && v) {
        group.dataset.value = v;
        const btn = group.querySelector(`button[data-rpe-value="${v}"]`);
        if (btn) btn.classList.add("selected");
      }
    }
  }
  (draft.sessions || []).forEach((s, sIdx) => {
    (s.blocks || []).forEach((b, bIdx) => {
      const blockEl = root.querySelector(`.block[data-session-idx="${sIdx}"][data-block-idx="${bIdx}"]`);
      if (!blockEl) return;
      if (b.skipped) {
        blockEl.dataset.skipped = "true";
        blockEl.querySelectorAll("input, select").forEach((el) => (el.disabled = true));
        const btn = blockEl.querySelector(".skip-btn");
        if (btn) {
          btn.textContent = "Skipped — tap to unskip";
          btn.dataset.action = "unskip";
        }
      }
      for (const [k, v] of Object.entries(b.entry || {})) {
        if (k === "attempts" && Array.isArray(v)) continue; // attempts hydration skipped for simplicity
        const input = blockEl.querySelector(`input[name="${k}"], select[name="${k}"]`);
        if (input) input.value = v;
        const group = blockEl.querySelector(`.rpe-buttons[data-rpe-name="${k}"]`);
        if (group && v) {
          group.dataset.value = v;
          const rpebtn = group.querySelector(`button[data-rpe-value="${v}"]`);
          if (rpebtn) rpebtn.classList.add("selected");
        }
      }
    });
  });
}

async function saveSession(state, dateIso, sess, sessIdx, root) {
  const draft = extractDraft(root);
  const pre = draft.pre || {};

  const blocks = sess.blocks.map((block, bi) => {
    const draftBlock = draft.sessions[sessIdx]?.blocks?.[bi] || { entry: {}, skipped: false };
    if (draftBlock.skipped) {
      return { ...block, skipped: true };
    }
    return { ...block, entry: coerceEntryTypes(block.type, draftBlock.entry) };
  });

  // Validate non-skipped blocks
  for (const b of blocks) {
    if (b.skipped) continue;
    const v = validateEntry(b.type, b.entry);
    if (!v.ok) throw new Error(`${b.name}: missing ${v.missing.join(", ")}`);
  }

  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const md = buildSessionMarkdown({
    date: dateIso,
    dayOfWeek,
    name: sess.name,
    phase: state.day.phase,
    week: state.day.week,
    sleep_h: Number(pre.sleep_h) || 0,
    mood: Number(pre.mood) || 0,
    body: pre.body || "—",
    blocks: blocks.map((b) =>
      b.skipped
        ? { label: blockLabel(b, sess), exercise: b.name, type: b.type, entry: { notes: "(skipped)" } }
        : { label: blockLabel(b, sess), exercise: b.name, type: b.type, entry: b.entry },
    ),
    globalNotes: pre.global_notes || "",
  });

  // Re-fetch latest log, splice, write with ETag.
  const latest = await readFile(state.log.fileId);
  const timestampStr = new Date().toISOString().slice(0, 16).replace("T", " ");
  const newContent = insertSession(latest.text, md, timestampStr);
  await writeFile(state.log.fileId, newContent, latest.etag);
}

function blockLabel(block, sess) {
  // Use index-based A/B/C labels
  const idx = sess.blocks.indexOf(block);
  return String.fromCharCode(65 + idx);
}

function coerceEntryTypes(type, entry) {
  const fields = fieldsFor(type);
  const out = {};
  for (const f of fields) {
    const v = entry[f.name];
    if (v === undefined || v === "") continue;
    if (f.kind === "integer") out[f.name] = parseInt(v, 10);
    else if (f.kind === "number" || f.kind === "rpe") out[f.name] = Number(v);
    else out[f.name] = v;
  }
  if (entry.attempts) out.attempts = entry.attempts;
  return out;
}

function timeNow() {
  return new Date().toTimeString().slice(0, 5);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

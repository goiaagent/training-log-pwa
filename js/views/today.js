import { getSession, prescribedForBlock, SESSIONS } from "../program-index.js";
import { fieldsFor, validateEntry } from "../exercise-types.js";
import { resolvePrescribed, isAdjustmentActive } from "../prescribed.js";
import { buildSessionMarkdown, insertSession } from "../log-builder.js";
import { getDraft, saveDraft, clearDraft, getLogText, saveLogText } from "../storage.js";

export function renderToday(root, state, { reload }) {
  const today = new Date();
  const dateIso = today.toISOString().slice(0, 10);

  // Active session keys = user override (from picker) or today's defaults.
  const defaultKeys = state.day?.sessionKeys || [];
  const activeKeys = state.activeSessionKeys ?? defaultKeys;

  // Adjustments + watchlist banners
  const activeAdjustments = state.log.parsed.adjustments.filter((a) => isAdjustmentActive(a, today));
  const watchlist = state.log.parsed.watchlist;

  // Custom mode: show block picker UI instead of normal form.
  if (state.customMode === "selecting") {
    root.innerHTML = `
      ${renderBanners(activeAdjustments, watchlist)}
      ${renderSessionPicker(activeKeys, defaultKeys, /*isCustom*/ true)}
      ${renderCustomBlockPicker(state)}
    `;
    wireSessionPicker(root, state, reload);
    wireCustomBlockPicker(root, state, reload);
    return;
  }

  // Determine which "session(s)" to render.
  let sessions;
  if (Array.isArray(state.customBlocks) && state.customBlocks.length) {
    sessions = [
      {
        name: "Custom",
        duration_min: 0,
        blocks: state.customBlocks,
        isCustom: true,
      },
    ];
  } else {
    sessions = activeKeys.map((key) => getSession(key)).filter(Boolean);
  }

  root.innerHTML = `
    ${renderBanners(activeAdjustments, watchlist)}
    ${renderSessionPicker(activeKeys, defaultKeys, /*isCustom*/ Array.isArray(state.customBlocks) && state.customBlocks.length > 0)}
    ${sessions.length ? renderPreSession(dateIso) : ""}
    ${sessions.length
      ? sessions.map((sess, i) => renderSession(sess, state.day, state.log.parsed.adjustments, today, dateIso, i)).join("")
      : `<p class="empty" style="text-align:center;padding:2rem;color:var(--text-secondary)">Rest day — pick a session above to log a workout.</p>`}
  `;

  wireSessionPicker(root, state, reload);

  // Restore drafts and wire input listeners
  if (sessions.length) wireForm(root, state, dateIso, sessions, reload);
}

function wireSessionPicker(root, state, reload) {
  const picker = root.querySelector("#session-picker");
  if (!picker) return;
  picker.addEventListener("change", () => {
    const val = picker.value;
    if (val === "__default__") {
      state.activeSessionKeys = null;
      state.customBlocks = null;
      state.customMode = null;
    } else if (val === "__rest__") {
      state.activeSessionKeys = [];
      state.customBlocks = null;
      state.customMode = null;
    } else if (val === "__custom__") {
      state.activeSessionKeys = null;
      state.customBlocks = [];
      state.customMode = "selecting";
    } else {
      state.activeSessionKeys = [val];
      state.customBlocks = null;
      state.customMode = null;
    }
    renderToday(root, state, { reload });
  });
}

function renderCustomBlockPicker(state) {
  const selectedSet = new Set((state.customBlocks || []).map((b) => `${b._fromSession}::${b.id}`));
  const sessionSections = Object.entries(SESSIONS)
    .map(([key, sess]) => {
      const items = sess.blocks
        .map((b) => {
          const checked = selectedSet.has(`${key}::${b.id}`) ? "checked" : "";
          return `<label class="custom-block-item">
            <input type="checkbox" data-session-key="${esc(key)}" data-block-id="${esc(b.id)}" ${checked}>
            <span>${esc(b.name)} <span class="muted">(${esc(b.type)})</span></span>
          </label>`;
        })
        .join("");
      return `<div class="custom-session-group">
        <h3>${esc(sess.name)}</h3>
        ${items}
      </div>`;
    })
    .join("");
  return `
    <div class="custom-picker">
      <p class="muted">Pick the blocks you want in today's custom session. Prescriptions and adjustments still apply.</p>
      ${sessionSections}
      <div class="custom-picker-actions">
        <button type="button" id="custom-build">Build session</button>
        <button type="button" id="custom-cancel">Cancel</button>
      </div>
    </div>
  `;
}

function wireCustomBlockPicker(root, state, reload) {
  const buildBtn = root.querySelector("#custom-build");
  const cancelBtn = root.querySelector("#custom-cancel");
  if (!buildBtn || !cancelBtn) return;

  buildBtn.addEventListener("click", () => {
    const picks = [];
    root.querySelectorAll('.custom-picker input[type="checkbox"]:checked').forEach((cb) => {
      const sessionKey = cb.dataset.sessionKey;
      const blockId = cb.dataset.blockId;
      const sess = SESSIONS[sessionKey];
      const block = sess?.blocks.find((b) => b.id === blockId);
      if (block) {
        // Tag with origin session for label-resolution; never written to log.md.
        picks.push({ ...block, _fromSession: sessionKey });
      }
    });
    if (!picks.length) {
      alert("Pick at least one block.");
      return;
    }
    state.customBlocks = picks;
    state.customMode = null;
    renderToday(root, state, { reload });
  });

  cancelBtn.addEventListener("click", () => {
    state.customBlocks = null;
    state.customMode = null;
    state.activeSessionKeys = null;
    renderToday(root, state, { reload });
  });
}

function renderSessionPicker(activeKeys, defaultKeys, isCustom) {
  const allKeys = Object.keys(SESSIONS);
  const isDefault =
    !isCustom &&
    activeKeys.length === defaultKeys.length &&
    activeKeys.every((k, i) => k === defaultKeys[i]);
  const isRest = !isCustom && activeKeys.length === 0;
  const currentValue = isCustom
    ? "__custom__"
    : isDefault
    ? "__default__"
    : isRest
    ? "__rest__"
    : activeKeys[0];
  const defaultLabel = defaultKeys.length
    ? defaultKeys.map((k) => SESSIONS[k]?.name || k).join(" + ")
    : "Rest";
  return `
    <div class="session-picker-wrap" style="padding:.75rem;background:var(--surface);border-radius:.5rem;margin-bottom:1rem">
      <label style="display:flex;flex-direction:column;gap:.25rem">
        <span style="font-size:.85rem;color:var(--text-secondary)">Workout</span>
        <select id="session-picker" style="padding:.5rem;font-size:1rem">
          <option value="__default__">Today's session — ${esc(defaultLabel)}</option>
          ${allKeys
            .map((k) => `<option value="${esc(k)}" ${k === currentValue ? "selected" : ""}>${esc(SESSIONS[k].name)}</option>`)
            .join("")}
          <option value="__custom__" ${isCustom ? "selected" : ""}>Custom — pick blocks…</option>
          <option value="__rest__" ${isRest ? "selected" : ""}>Rest (no workout)</option>
        </select>
      </label>
    </div>
  `;
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
      <button class="save-btn" data-action="save" data-session-idx="${idx}">Save session</button>
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
    .map(([k, v]) => (k === "target" ? `🎯 ${v}` : `${k.replace(/_/g, " ")}: ${v}`))
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
  if (field.kind === "set_table") {
    const placeholders = prescribedValue && typeof prescribedValue === "object" ? prescribedValue : {};
    return `<div class="field set-table-field" data-field="set-table" data-field-name="${esc(name)}">
      <div class="set-table-header">
        <span class="field-label">${label}</span>
        <button type="button" class="add-set-row">+ Add set</button>
      </div>
      <div class="set-rows" data-columns='${esc(JSON.stringify(field.columns))}'></div>
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

  // Set tables — seed with one row, wire add-row
  root.querySelectorAll(".set-table-field").forEach((wrap) => {
    const rowsContainer = wrap.querySelector(".set-rows");
    if (rowsContainer.children.length === 0) addSetRow(rowsContainer);
  });
  root.querySelectorAll(".add-set-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = btn.closest(".set-table-field");
      addSetRow(wrap.querySelector(".set-rows"));
      persistDraft();
      bindAllInputs();
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
    // Resolve to the nearest element carrying a data-action, in case the tap
    // landed on a child (icon/text node) of the button.
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === "remove-set") {
      actionEl.closest(".set-row").remove();
      const container = actionEl.closest(".set-rows");
      if (container) {
        container.querySelectorAll(".set-row").forEach((r, i) => {
          const label = r.querySelector(".set-row-label");
          if (label) label.textContent = `Set ${i + 1}`;
        });
      }
      persistDraft();
      return;
    }
    if (action === "remove-attempt") {
      actionEl.closest(".attempt-row").remove();
      persistDraft();
      return;
    }
    if (action === "skip") {
      const block = actionEl.closest(".block");
      block.dataset.skipped = "true";
      block.querySelectorAll("input, select").forEach((el) => (el.disabled = true));
      block.classList.add("is-skipped");
      actionEl.textContent = "✓ Skipped — tap to unskip";
      actionEl.dataset.action = "unskip";
      persistDraft();
      return;
    }
    if (action === "unskip") {
      const block = actionEl.closest(".block");
      delete block.dataset.skipped;
      block.querySelectorAll("input, select").forEach((el) => (el.disabled = false));
      block.classList.remove("is-skipped");
      actionEl.textContent = "Mark skipped";
      actionEl.dataset.action = "skip";
      persistDraft();
      return;
    }
  });

  // Persist any input change. Re-bind whenever rows are added dynamically.
  function bindAllInputs() {
    root.querySelectorAll("input, select").forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("input", persistDraft);
    });
  }
  bindAllInputs();

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

function addSetRow(container, values = {}) {
  let columns;
  try {
    columns = JSON.parse(container.dataset.columns);
  } catch {
    columns = [];
  }
  const idx = container.children.length;
  const row = document.createElement("div");
  row.className = "set-row";
  row.innerHTML = `
    <span class="set-row-label">Set ${idx + 1}</span>
    ${columns
      .map((c) => {
        const v = values[c.name] !== undefined ? esc(String(values[c.name])) : "";
        const isNum = c.kind === "integer" || c.kind === "number";
        const step = c.kind === "number" ? "0.5" : "1";
        return `<input type="${isNum ? "number" : "text"}" step="${step}" inputmode="${isNum ? "decimal" : "text"}" placeholder="${esc(c.label)}" data-col="${esc(c.name)}" value="${v}">`;
      })
      .join("")}
    <button type="button" data-action="remove-set" aria-label="Remove">×</button>
  `;
  container.appendChild(row);
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

      // set tables
      b.querySelectorAll(".set-table-field").forEach((wrap) => {
        const name = wrap.dataset.fieldName;
        const rows = [];
        wrap.querySelectorAll(".set-row").forEach((row) => {
          const r = {};
          row.querySelectorAll("[data-col]").forEach((el) => {
            if (el.value !== "") r[el.dataset.col] = el.type === "number" ? Number(el.value) : el.value;
          });
          if (Object.keys(r).length) rows.push(r);
        });
        if (rows.length) entry[name] = rows;
      });

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
        // Hydrate set tables.
        if (Array.isArray(v) && v.length && typeof v[0] === "object") {
          const wrap = blockEl.querySelector(`.set-table-field[data-field-name="${k}"]`);
          if (wrap) {
            const container = wrap.querySelector(".set-rows");
            container.innerHTML = "";
            v.forEach((rowVals) => addSetRow(container, rowVals));
          }
          continue;
        }
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
    const label = String.fromCharCode(65 + bi); // A, B, C, ...
    if (draftBlock.skipped) {
      return { ...block, _label: label, skipped: true };
    }
    return { ...block, _label: label, entry: coerceEntryTypes(block.type, draftBlock.entry) };
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
        ? { label: b._label, exercise: b.name, type: b.type, entry: { notes: "(skipped)" } }
        : { label: b._label, exercise: b.name, type: b.type, entry: b.entry },
    ),
    globalNotes: pre.global_notes || "",
  });

  // Splice into local log.md and persist.
  const latest = getLogText() || state.log.text;
  const timestampStr = new Date().toISOString().slice(0, 16).replace("T", " ");
  const newContent = insertSession(latest, md, timestampStr);
  saveLogText(newContent);
  state.log = { text: newContent, parsed: (await import("../log-parser.js")).parseLog(newContent) };
}

function coerceEntryTypes(type, entry) {
  const fields = fieldsFor(type);
  const out = {};
  for (const f of fields) {
    const v = entry[f.name];
    if (v === undefined || v === "") continue;
    if (f.kind === "integer") out[f.name] = parseInt(v, 10);
    else if (f.kind === "number" || f.kind === "rpe") out[f.name] = Number(v);
    else if (f.kind === "set_table" && Array.isArray(v)) {
      out[f.name] = v.map((row) => {
        const r = {};
        for (const col of f.columns) {
          const cv = row[col.name];
          if (cv === undefined || cv === "") continue;
          r[col.name] = col.kind === "integer" ? parseInt(cv, 10) : col.kind === "number" ? Number(cv) : cv;
        }
        return r;
      });
    } else out[f.name] = v;
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

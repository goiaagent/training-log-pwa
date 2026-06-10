// Per-exercise graph view. Estimated 1RM (Epley) over time.
// Reads parsed sessions from state.log.parsed.

export function renderGraph(root, state, { navigate }) {
  const target = decodeURIComponent((location.hash.split("?")[1] || "").replace(/^exercise=/, ""));
  const sessions = state.log.parsed.sessions || [];

  // Collect all exercise names (unique, sorted) that have setRows with weight + reps.
  const allExercises = collectExercises(sessions);
  const selected = target && allExercises.includes(target) ? target : allExercises[0] || null;

  root.innerHTML = `
    <div style="margin-bottom:1rem">
      <a href="#/log" style="color:var(--text-secondary);text-decoration:none">← back to log</a>
    </div>
    ${
      allExercises.length === 0
        ? `<p class="empty" style="text-align:center;padding:2rem;color:var(--text-secondary)">No exercise data yet. Log some sessions with weighted sets first.</p>`
        : `
      <label style="display:block;margin-bottom:1rem">
        <span style="display:block;font-size:.85rem;color:var(--text-secondary);margin-bottom:.25rem">Exercise</span>
        <select id="graph-select" style="padding:.5rem;font-size:1rem;width:100%">
          ${allExercises.map((e) => `<option value="${esc(e)}" ${e === selected ? "selected" : ""}>${esc(e)}</option>`).join("")}
        </select>
      </label>
      <div id="graph-container"></div>
    `
    }
  `;

  if (!allExercises.length) return;

  const sel = document.getElementById("graph-select");
  sel.addEventListener("change", () => {
    location.hash = `#/graph?exercise=${encodeURIComponent(sel.value)}`;
  });

  renderChart(document.getElementById("graph-container"), sessions, selected);
}

function collectExercises(sessions) {
  const set = new Set();
  for (const s of sessions) {
    for (const b of s.blocks || []) {
      if (blockMetric(b)) set.add(b.exercise);
    }
  }
  return Array.from(set).sort();
}

// Pick the most meaningful single number for a block, depending on what its
// set rows contain. Returns { value, label, unit } or null if not chartable.
function blockMetric(block) {
  const rows = block.entry?.setRows;
  if (!Array.isArray(rows) || !rows.length) return null;
  const nums = (k) => rows.map((r) => Number(r[k]) || 0);

  // Weighted reps → estimated 1RM via Epley: weight × (1 + reps/30).
  if (rows.some((r) => r.load_kg > 0 && r.reps > 0)) {
    const best = Math.max(
      ...rows.map((r) => (r.load_kg > 0 && r.reps > 0 ? r.load_kg * (1 + r.reps / 30) : 0)),
    );
    return { value: best, label: "Est. 1RM", unit: "kg" };
  }
  // Weighted symmetric holds (fingerboard) → load·seconds volume, captures
  // both load and hold quality (35kg × 13s total reads worse than 30kg × 32s).
  if (rows.some((r) => r.load_kg > 0 && r.hold_seconds > 0)) {
    const vol = rows.reduce((a, r) => a + (Number(r.load_kg) || 0) * (Number(r.hold_seconds) || 0), 0);
    return { value: vol, label: "Load × hold volume", unit: "kg·s" };
  }
  // Weighted per-side holds (pinch) → load·seconds volume across both sides.
  if (rows.some((r) => r.load_kg > 0 && (r.hold_s_left > 0 || r.hold_s_right > 0))) {
    const vol = rows.reduce(
      (a, r) => a + (Number(r.load_kg) || 0) * ((Number(r.hold_s_left) || 0) + (Number(r.hold_s_right) || 0)),
      0,
    );
    return { value: vol, label: "Load × hold volume", unit: "kg·s" };
  }
  // Bodyweight reps (Dragon Flag, T2B at load 0) → best set.
  if (rows.some((r) => r.reps > 0)) {
    return { value: Math.max(...nums("reps")), label: "Best-set reps", unit: "reps" };
  }
  // Bodyweight holds (front lever) → longest hold.
  if (rows.some((r) => r.hold_seconds > 0)) {
    return { value: Math.max(...nums("hold_seconds")), label: "Longest hold", unit: "s" };
  }
  // Per-side reps (OAPU, bounds, copenhagen) → weaker-side best set.
  if (rows.some((r) => r.reps_left > 0 || r.reps_right > 0)) {
    const best = Math.max(...rows.map((r) => Math.min(Number(r.reps_left) || 0, Number(r.reps_right) || 0)));
    return { value: best, label: "Reps (weaker side)", unit: "reps" };
  }
  return null;
}

function dataForExercise(sessions, name) {
  const points = [];
  let label = null;
  let unit = "";
  // Sessions are typically newest-first in parsed array.
  for (const s of sessions) {
    let best = null;
    for (const b of s.blocks || []) {
      if (b.exercise !== name) continue;
      const m = blockMetric(b);
      if (!m) continue;
      if (best == null || m.value > best) best = m.value;
      label = m.label;
      unit = m.unit;
    }
    if (best != null) points.push({ date: s.date, value: best });
  }
  // Sort oldest → newest for plotting.
  return { points: points.sort((a, b) => a.date.localeCompare(b.date)), label, unit };
}

function renderChart(container, sessions, exerciseName) {
  const { points: data, label: metricLabel, unit } = dataForExercise(sessions, exerciseName);
  if (data.length < 1) {
    container.innerHTML = `<p class="empty" style="padding:1rem;color:var(--text-secondary)">No data points yet.</p>`;
    return;
  }
  const W = 320;
  const H = 220;
  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.value);
  const yMin = Math.min(...ys) * 0.95;
  const yMax = Math.max(...ys) * 1.05;
  const xScale = (i) => padL + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yScale = (v) => padT + (1 - (v - yMin) / (yMax - yMin || 1)) * plotH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
    .join(" ");

  const dots = data
    .map(
      (d, i) =>
        `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(d.value).toFixed(1)}" r="3" fill="var(--accent, #4af)"></circle>`,
    )
    .join("");

  // Y-axis ticks: 3 evenly spaced
  const yTicks = [yMin, (yMin + yMax) / 2, yMax].map((v) => ({
    v,
    y: yScale(v),
  }));

  // X-axis labels: first, middle, last date
  const xLabels = [];
  if (data.length >= 1) xLabels.push({ i: 0, label: data[0].date.slice(5) });
  if (data.length >= 3) xLabels.push({ i: Math.floor(data.length / 2), label: data[Math.floor(data.length / 2)].date.slice(5) });
  if (data.length >= 2) xLabels.push({ i: data.length - 1, label: data[data.length - 1].date.slice(5) });

  const latest = data[data.length - 1];
  const first = data[0];
  const delta = data.length >= 2 ? latest.value - first.value : 0;
  const deltaPct = first.value ? (delta / first.value) * 100 : 0;

  container.innerHTML = `
    <div style="margin-bottom:.75rem">
      <div style="font-size:1.5rem;font-weight:600">${latest.value.toFixed(1)} ${unit}</div>
      <div style="font-size:.85rem;color:var(--text-secondary)">
        ${metricLabel} · ${data.length} session${data.length === 1 ? "" : "s"}
        ${data.length >= 2 ? ` · ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}${unit} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)` : ""}
      </div>
    </div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="background:var(--surface);border-radius:.5rem">
      ${yTicks
        .map(
          (t) =>
            `<line x1="${padL}" x2="${W - padR}" y1="${t.y.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="var(--border, #333)" stroke-dasharray="2 4"></line>
             <text x="${padL - 6}" y="${t.y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-size="10" fill="var(--text-secondary)">${t.v.toFixed(0)}</text>`,
        )
        .join("")}
      ${xLabels
        .map(
          (l) =>
            `<text x="${xScale(l.i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${l.label}</text>`,
        )
        .join("")}
      <path d="${path}" fill="none" stroke="var(--accent, #4af)" stroke-width="2"></path>
      ${dots}
    </svg>
  `;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

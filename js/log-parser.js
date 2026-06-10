// Parse log.md into structured objects.
// Robustness goal: tolerate trailing whitespace, blank lines, missing sections.
// Anything we can't parse cleanly is preserved as `raw` so nothing is lost.

const SECTION_RE = /^## (Active Adjustments|Watchlist|Sessions|Daily Reviews|Weekly Reviews)\s*$/;

export function parseLog(text) {
  const lines = text.split("\n");
  const sections = splitSections(lines);

  return {
    adjustments: parseAdjustments(sections["Active Adjustments"] || []),
    watchlist: parseWatchlist(sections["Watchlist"] || []),
    sessions: parseSessions(sections["Sessions"] || []),
    dailyReviewsRaw: (sections["Daily Reviews"] || []).join("\n"),
    weeklyReviewsRaw: (sections["Weekly Reviews"] || []).join("\n"),
  };
}

function splitSections(lines) {
  const out = {};
  let current = null;
  for (const line of lines) {
    const m = line.match(SECTION_RE);
    if (m) {
      current = m[1];
      out[current] = [];
      continue;
    }
    if (current) out[current].push(line);
  }
  return out;
}

// Adjustment line example:
// - **fingerboard-maxhangs.load_kg** — 35 (was program 37.5). Reason: ...
//   Auto-expire: next clean Mon session. (set 2026-07-14)
function parseAdjustments(lines) {
  const text = lines.join("\n");
  const items = text.split(/\n(?=- \*\*)/).filter((s) => s.trim().startsWith("- **"));
  return items.map((item) => {
    const keyMatch = item.match(/- \*\*([^*]+)\*\*\s*—\s*(.+)/s);
    if (!keyMatch) return { key: null, raw: item.trim() };
    const [, key, rest] = keyMatch;
    const expireMatch = rest.match(/Auto-expire:\s*([^.()\n]+?)(?:\.|$|\n|\(set)/);
    const setMatch = rest.match(/\(set\s+(\d{4}-\d{2}-\d{2})\)/);
    return {
      key: key.trim(),
      raw: rest.trim(),
      expire: expireMatch ? expireMatch[1].trim() : null,
      set: setMatch ? setMatch[1] : null,
    };
  });
}

// Watchlist line example:
// - **sleep** — <6h logged 3 of last 5 days. ...
function parseWatchlist(lines) {
  const text = lines.join("\n");
  const items = text.split(/\n(?=- \*\*)/).filter((s) => s.trim().startsWith("- **"));
  return items.map((item) => {
    const m = item.match(/- \*\*([^*]+)\*\*\s*—\s*(.+)/s);
    if (!m) return { topic: null, raw: item.trim() };
    return { topic: m[1].trim(), raw: m[2].trim() };
  });
}

// Session block parser.
function parseSessions(lines) {
  const sessions = [];
  let current = null;
  let blockBuffer = null;

  const flushBlock = () => {
    if (blockBuffer && current) {
      current.blocks.push(finalizeBlock(blockBuffer));
      blockBuffer = null;
    }
  };

  const flushSession = () => {
    flushBlock();
    if (current) sessions.push(current);
    current = null;
  };

  for (const line of lines) {
    const sessHeader = line.match(/^### (\d{4}-\d{2}-\d{2})\s*—\s*(\w+)\s*—\s*(.+?)\s*$/);
    if (sessHeader) {
      flushSession();
      current = {
        date: sessHeader[1],
        dayOfWeek: sessHeader[2],
        name: sessHeader[3],
        phase: null,
        week: null,
        sleep_h: null,
        mood: null,
        soreness: null,
        body: null,
        blocks: [],
        globalNotes: "",
      };
      continue;
    }
    if (!current) continue;

    const meta = line.match(/\*\*Phase:\*\*\s*(\d+)\s*·\s*\*\*Week:\*\*\s*(\d+)/);
    if (meta) {
      current.phase = Number(meta[1]);
      current.week = Number(meta[2]);
      const sleep = line.match(/Sleep prev night:\*\*\s*([\d.]+)h/);
      if (sleep) current.sleep_h = Number(sleep[1]);
      const mood = line.match(/Mood:\*\*\s*(\d+)\/5/);
      if (mood) current.mood = Number(mood[1]);
      const soreness = line.match(/Soreness:\*\*\s*(\d+)\/5/);
      if (soreness) current.soreness = Number(soreness[1]);
      const body = line.match(/Body:\*\*\s*(.+?)\s*$/);
      if (body) current.body = body[1].trim();
      continue;
    }

    const blockHeader = line.match(/^\*\*Block\s+([A-Z\d]+)\s*—\s*(.+?)\*\*\s+_\((\w+)\)_/);
    if (blockHeader) {
      flushBlock();
      blockBuffer = {
        label: blockHeader[1],
        exercise: blockHeader[2].trim(),
        type: blockHeader[3].trim(),
        fieldsLine: "",
        notes: "",
        setRows: [],
        attempts: [],
      };
      continue;
    }

    if (blockBuffer) {
      const setLine = line.match(/^-\s*Set\s+(\d+):\s*(.+)$/i);
      if (setLine) {
        blockBuffer.setRows[Number(setLine[1]) - 1] = parseKvParts(setLine[2]);
        continue;
      }
      const attemptLine = line.match(/^-\s*Attempt\s+(\d+):\s*(.+)$/i);
      if (attemptLine) {
        blockBuffer.attempts[Number(attemptLine[1]) - 1] = parseKvParts(attemptLine[2]);
        continue;
      }
      const isNotesLine = /^-\s*Notes:/i.test(line);
      if (isNotesLine) {
        blockBuffer.notes = line.replace(/^-\s*Notes:\s*/i, "").trim();
        continue;
      }
      const isFieldsLine = /^-\s/.test(line) && !blockBuffer.fieldsLine;
      if (isFieldsLine) {
        blockBuffer.fieldsLine = line.replace(/^-\s*/, "").trim();
        continue;
      }
    }

    const gn = line.match(/^\*\*Global notes:\*\*\s*(.*)$/);
    if (gn && current) {
      current.globalNotes = gn[1].trim();
      continue;
    }
  }
  flushSession();
  return sessions;
}

function finalizeBlock(b) {
  const entry = parseKvParts(b.fieldsLine);
  if (b.setRows.length) entry.setRows = b.setRows.filter(Boolean);
  if (b.attempts.length) entry.attempts = b.attempts.filter(Boolean);
  if (b.notes) entry.notes = b.notes;
  return {
    label: b.label,
    exercise: b.exercise,
    type: b.type,
    entry,
  };
}

// "load_kg: 35 · sets: 4 · hold_seconds: 8 · rpe: 9" → { load_kg: 35, sets: 4, ... }
function parseKvParts(line) {
  const out = {};
  if (!line) return out;
  for (const part of line.split("·")) {
    const m = part.match(/^\s*([\w_]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const [, name, valueRaw] = m;
    const num = Number(valueRaw);
    out[name] = Number.isFinite(num) && /^[\d.]+$/.test(valueRaw) ? num : valueRaw;
  }
  return out;
}

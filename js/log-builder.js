// Build markdown from structured session data, and splice into log.md.

export const EMPTY_LOG_TEMPLATE = `# Hybrid Athlete Training Log

**Program start:** 2026-05-14
**Last updated:** (uninitialized)

## Active Adjustments

## Watchlist

## Sessions

## Daily Reviews

## Weekly Reviews
`;

export function buildSessionMarkdown(session) {
  const {
    date,
    dayOfWeek,
    name,
    phase,
    week,
    sleep_h,
    mood,
    body,
    blocks,
    globalNotes,
  } = session;

  const header = `### ${date} — ${dayOfWeek} — ${name}`;
  const meta = `**Phase:** ${phase} · **Week:** ${week} · **Sleep prev night:** ${sleep_h}h · **Mood:** ${mood}/5 · **Body:** ${body || "—"}`;

  const blockChunks = blocks.map((b) => renderBlock(b));
  const globalLine = globalNotes ? `**Global notes:** ${globalNotes}` : "";

  return [header, "", meta, "", ...blockChunks, globalLine].filter((s) => s !== null).join("\n");
}

function renderBlock(block) {
  const { label, exercise, type, entry } = block;
  const head = `**Block ${label} — ${exercise}** _(${type})_`;
  const lines = [head];

  // setRows render as separate "- Set N: ..." lines.
  if (Array.isArray(entry.setRows) && entry.setRows.length) {
    entry.setRows.forEach((row, i) => {
      const parts = Object.entries(row)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      lines.push(`- Set ${i + 1}: ${parts}`);
    });
  }

  // Other scalar fields on a single trailing line.
  const scalars = Object.entries(entry)
    .filter(
      ([k, v]) =>
        k !== "setRows" &&
        k !== "notes" &&
        k !== "attempts" &&
        v !== undefined &&
        v !== "" &&
        v !== null,
    )
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  if (scalars) lines.push(`- ${scalars}`);

  if (entry.notes && String(entry.notes).trim()) lines.push(`- Notes: ${String(entry.notes).trim()}`);
  if (Array.isArray(entry.attempts) && entry.attempts.length) {
    entry.attempts.forEach((a, i) => {
      const parts = Object.entries(a)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      lines.push(`- Attempt ${i + 1}: ${parts}`);
    });
  }
  lines.push("");
  return lines.join("\n");
}

export function insertSession(existingMd, newSessionMd, timestampStr) {
  let out = existingMd;

  // Update the Last updated line. If missing/uninitialized, insert it after the title.
  if (/\*\*Last updated:\*\*/.test(out)) {
    out = out.replace(/\*\*Last updated:\*\*[^\n]*/, `**Last updated:** ${timestampStr}`);
  } else {
    out = out.replace(
      /^(# .+\n)/,
      `$1\n**Last updated:** ${timestampStr}\n`,
    );
  }

  // Insert at top of ## Sessions section, before the next ## or end of file.
  const sessIdx = out.indexOf("## Sessions");
  if (sessIdx === -1) {
    throw new Error("log.md is missing the ## Sessions section");
  }
  const afterSessHeader = out.indexOf("\n", sessIdx) + 1;
  return (
    out.slice(0, afterSessHeader) +
    "\n" +
    newSessionMd.trim() +
    "\n" +
    out.slice(afterSessHeader)
  );
}

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
  const fieldOrder = Object.keys(entry).filter((k) => k !== "notes" && entry[k] !== undefined && entry[k] !== "");
  const fields = fieldOrder.map((k) => `${k}: ${entry[k]}`).join(" · ");
  const lines = [head, `- ${fields}`];
  if (entry.notes && entry.notes.trim()) lines.push(`- Notes: ${entry.notes.trim()}`);
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

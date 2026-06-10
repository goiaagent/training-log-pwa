// Fetch the public log.md from GitHub raw, and merge into local.
// Local owns Sessions; remote owns Active Adjustments / Watchlist / Daily Reviews / Weekly Reviews.

import { config } from "../config.js";

export async function fetchRemoteLog() {
  try {
    const res = await fetch(config.githubRawLogUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Replace the contents of a section in `text` with `newBody`.
// Section header is the literal "## Heading" line; body is everything until the next "## " or EOF.
function replaceSection(text, heading, newBody) {
  const start = text.indexOf(heading);
  if (start === -1) return text + `\n\n${heading}\n\n${newBody.trim()}\n`;
  const afterHeader = text.indexOf("\n", start) + 1;
  let end = text.indexOf("\n## ", afterHeader);
  if (end === -1) end = text.length;
  return text.slice(0, afterHeader) + "\n" + newBody.trim() + "\n\n" + text.slice(end + 1);
}

function extractSection(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return "";
  const afterHeader = text.indexOf("\n", start) + 1;
  let end = text.indexOf("\n## ", afterHeader);
  if (end === -1) end = text.length;
  return text.slice(afterHeader, end).trim();
}

// Split a "## Sessions" body into individual session blocks keyed by their
// "### date — day — name" header line.
function splitSessions(sectionText) {
  return sectionText
    .split(/\n(?=### )/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("### "))
    .map((text) => ({ header: text.split("\n")[0].trim(), text }));
}

// Merge: remote owns Active Adjustments / Watchlist / Reviews; Sessions are
// the UNION of both sides, deduped by header (local version wins when both
// have the same session, since the user may have edited it on-device).
//
// Union — not local-wins-wholesale — because sessions are append-only facts.
// A freshly wiped device (site-data clear for an SW update) starts with an
// empty local log; taking Sessions only from local would propagate that
// emptiness to GitHub on the next push and erase history.
export function mergeRemoteIntoLocal(localText, remoteText) {
  const local = splitSessions(extractSection(localText, "## Sessions"));
  const remote = splitSessions(extractSection(remoteText, "## Sessions"));
  const seen = new Set(local.map((s) => s.header));
  const all = [...local, ...remote.filter((s) => !seen.has(s.header))];
  // Newest first by the ISO date embedded in the header ("### YYYY-MM-DD — …").
  all.sort((a, b) => b.header.slice(4, 14).localeCompare(a.header.slice(4, 14)));
  return replaceSection(remoteText, "## Sessions", all.map((s) => s.text).join("\n\n"));
}

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

// Take Sessions from local, take everything else from remote.
// Used after fetchRemoteLog returns content: refresh the read-only sections without losing local sessions.
export function mergeRemoteIntoLocal(localText, remoteText) {
  const localSessions = extractSection(localText, "## Sessions");
  return replaceSection(remoteText, "## Sessions", localSessions);
}

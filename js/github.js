// Direct log.md sync to GitHub via the Contents API.
// Auth: fine-grained PAT (single repo, Contents read/write) pasted into
// Settings and stored in localStorage. On push we first fetch the remote
// file and merge (local owns Sessions, remote owns Adjustments/Watchlist/
// Reviews) so we never clobber analyses Claude committed after our last
// launch. mergeRemoteIntoLocal is the same function used on app start.

import { config } from "../config.js";
import { getGhToken, getLogText, saveLogText } from "./storage.js";
import { mergeRemoteIntoLocal } from "./remote.js";

const API = "https://api.github.com";

function b64encodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decodeUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function contentsUrl() {
  return `${API}/repos/${config.githubRepo}/contents/${config.githubLogPath}`;
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function getRemoteFile(token) {
  const res = await fetch(`${contentsUrl()}?ref=${config.githubBranch}`, {
    headers: headers(token),
    cache: "no-store",
  });
  if (res.status === 404) return { sha: null, text: null };
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const data = await res.json();
  return { sha: data.sha, text: b64decodeUtf8(data.content) };
}

export function hasGhToken() {
  return Boolean(getGhToken());
}

// Push the local log to GitHub. Returns:
//   { skipped: true }            — no token configured / nothing to push
//   { ok: true, content }        — pushed; content is the merged text
// Throws on network/auth errors. Retries once on a sha conflict (409/422).
export async function pushLogToGitHub() {
  const token = getGhToken();
  const local = getLogText();
  if (!token || !local) return { skipped: true };

  for (let attempt = 0; attempt < 2; attempt++) {
    const remote = await getRemoteFile(token);
    const content = remote.text ? mergeRemoteIntoLocal(local, remote.text) : local;
    if (remote.text !== null && content === remote.text) {
      return { ok: true, content }; // nothing new to push
    }
    const res = await fetch(contentsUrl(), {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `log: session sync from PWA (${new Date().toISOString().slice(0, 16)})`,
        content: b64encodeUtf8(content),
        branch: config.githubBranch,
        ...(remote.sha ? { sha: remote.sha } : {}),
      }),
    });
    if (res.ok) {
      // Persist the merged text locally so adjustments stay fresh too.
      saveLogText(content);
      return { ok: true, content };
    }
    // sha went stale between GET and PUT — refetch and retry once.
    if ((res.status === 409 || res.status === 422) && attempt === 0) continue;
    throw new Error(`GitHub write failed: ${res.status}`);
  }
  throw new Error("GitHub write failed: conflict persisted after retry");
}

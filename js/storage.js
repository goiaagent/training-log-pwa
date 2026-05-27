// Thin wrapper around localStorage. Namespaced under "tlpwa:".

const NS = "tlpwa:";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(NS + key, JSON.stringify(value));
}

function remove(key) {
  localStorage.removeItem(NS + key);
}

// Drafts: per-day form state, keyed by ISO date.
export function getDraft(dateIso) {
  return readJson(`draft:${dateIso}`, null);
}

export function saveDraft(dateIso, draft) {
  writeJson(`draft:${dateIso}`, draft);
}

export function clearDraft(dateIso) {
  remove(`draft:${dateIso}`);
}

// OAuth token (volatile; lasts ~1 hour).
export function getToken() {
  return readJson("oauth-token", null);
}

export function saveToken(token) {
  writeJson("oauth-token", token);
}

export function clearToken() {
  remove("oauth-token");
}

// Pending offline saves: list of { dateIso, markdown, attemptedAt }.
export function getPendingSaves() {
  return readJson("pending-saves", []);
}

export function enqueuePendingSave(entry) {
  const list = getPendingSaves();
  list.push(entry);
  writeJson("pending-saves", list);
}

export function clearPendingSaves() {
  remove("pending-saves");
}

// Cached log.md content for offline read.
export function getCachedLog() {
  return readJson("cached-log", null);
}

export function saveCachedLog(text, etag) {
  writeJson("cached-log", { text, etag, cachedAt: Date.now() });
}

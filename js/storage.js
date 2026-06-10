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

function readString(key) {
  return localStorage.getItem(NS + key);
}

function writeString(key, value) {
  localStorage.setItem(NS + key, value);
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

// Full log.md as a string blob — primary store.
export function getLogText() {
  return readString("log");
}

export function saveLogText(text) {
  writeString("log", text);
}

// Fine-grained GitHub PAT for direct log.md sync (Settings → GitHub sync).
export function getGhToken() {
  return readString("gh-token");
}

export function saveGhToken(token) {
  writeString("gh-token", token);
}

export function clearGhToken() {
  remove("gh-token");
}

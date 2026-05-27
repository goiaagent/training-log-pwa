// Google Drive REST API v3 client.
// Operations: find a file by name within the configured folder, read its content
// (returning ETag), and write content back (with If-Match for conflict detection).

import { config } from "../config.js";
import { getOrRefreshToken } from "./auth.js";
import { saveCachedLog } from "./storage.js";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

async function authHeaders() {
  const token = await getOrRefreshToken();
  return { Authorization: `Bearer ${token.access_token}` };
}

export async function findFileId(name, folderId = config.driveFolderId) {
  const headers = await authHeaders();
  const q = `name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
  const url = `${API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function readFile(fileId) {
  const headers = await authHeaders();
  const url = `${API}/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);
  const etag = res.headers.get("ETag");
  const text = await res.text();
  return { text, etag };
}

export async function writeFile(fileId, text, ifMatchEtag = null) {
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "text/markdown",
  };
  if (ifMatchEtag) headers["If-Match"] = ifMatchEtag;
  const url = `${UPLOAD}/files/${fileId}?uploadType=media`;
  const res = await fetch(url, { method: "PATCH", headers, body: text });
  if (res.status === 412) {
    const err = new Error("Drive write conflict (ETag mismatch)");
    err.code = "CONFLICT";
    throw err;
  }
  if (!res.ok) throw new Error(`Drive write failed: ${res.status}`);
  return await res.json();
}

export async function createFile(name, text, folderId = config.driveFolderId) {
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json; charset=UTF-8",
  };
  // Two-step: create metadata, then upload content.
  const metaRes = await fetch(`${API}/files`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, parents: [folderId], mimeType: "text/markdown" }),
  });
  if (!metaRes.ok) throw new Error(`Drive create (meta) failed: ${metaRes.status}`);
  const meta = await metaRes.json();
  await writeFile(meta.id, text);
  return meta.id;
}

// High-level: load log.md, creating it if missing.
export async function loadLog() {
  const { logFilename } = config;
  let fileId = await findFileId(logFilename);
  if (!fileId) {
    const { EMPTY_LOG_TEMPLATE } = await import("./log-builder.js");
    fileId = await createFile(logFilename, EMPTY_LOG_TEMPLATE);
  }
  const { text, etag } = await readFile(fileId);
  saveCachedLog(text, etag);
  return { fileId, text, etag };
}

export async function loadProgram() {
  const { programFilename } = config;
  const fileId = await findFileId(programFilename);
  if (!fileId) throw new Error(`${programFilename} not found in configured Drive folder`);
  const { text, etag } = await readFile(fileId);
  return { fileId, text, etag };
}

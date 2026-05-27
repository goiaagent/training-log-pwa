// Google OAuth using Google Identity Services (token client).
// Scope: drive.file is preferred (only files this app creates/opens via picker),
// but for this app we need access to existing files — use drive scope.
// If you want a tighter scope, switch to drive.file and have the user pick
// the folder via Google Picker API (out of scope for v1).

import { config } from "../config.local.js";
import { saveToken, getToken, clearToken } from "./storage.js";

const SCOPE = "https://www.googleapis.com/auth/drive";
let tokenClient = null;
let initPromise = null;

function loadGis() {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return initPromise;
}

async function ensureTokenClient() {
  await loadGis();
  if (tokenClient) return tokenClient;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: config.googleClientId,
    scope: SCOPE,
    callback: () => {}, // overridden per request
  });
  return tokenClient;
}

export async function signIn({ interactive = true } = {}) {
  const client = await ensureTokenClient();
  return new Promise((resolve, reject) => {
    client.callback = (response) => {
      if (response.error) return reject(new Error(response.error));
      const token = {
        access_token: response.access_token,
        expires_at: Date.now() + (response.expires_in - 60) * 1000,
      };
      saveToken(token);
      resolve(token);
    };
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

export function getValidToken() {
  const t = getToken();
  if (!t) return null;
  if (Date.now() >= t.expires_at) return null;
  return t;
}

export async function getOrRefreshToken() {
  const cached = getValidToken();
  if (cached) return cached;
  // Try silent first; if that fails, the caller should retry with interactive: true
  try {
    return await signIn({ interactive: false });
  } catch {
    return await signIn({ interactive: true });
  }
}

export function signOut() {
  clearToken();
  // Revoke not strictly required for v1; user can revoke via Google account.
}

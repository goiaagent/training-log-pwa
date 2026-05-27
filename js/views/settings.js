import { config } from "../../config.local.js";
import { getToken, clearToken, getCachedLog } from "../storage.js";
import { signIn, signOut } from "../auth.js";

export function renderSettings(root, state, { reload }) {
  const token = getToken();
  const cached = getCachedLog();

  root.innerHTML = `
    <section>
      <h2>Account</h2>
      <p>${token ? `Signed in. Token expires ${new Date(token.expires_at).toLocaleTimeString()}.` : "Signed out."}</p>
      <button id="signin">Sign in</button>
      <button id="signout">Sign out</button>
    </section>

    <section>
      <h2>Drive files</h2>
      <p>Folder ID: <code>${esc(config.driveFolderId)}</code></p>
      <p>Program: <code>${esc(config.programFilename)}</code></p>
      <p>Log: <code>${esc(config.logFilename)}</code></p>
      <p class="muted">${cached ? `Cached log at ${new Date(cached.cachedAt).toLocaleString()}` : "No cached log."}</p>
      <button id="manual-sync">Force re-sync from Drive</button>
    </section>

    <section>
      <h2>Backup</h2>
      <button id="export-log">Download log.md backup</button>
    </section>

    <section>
      <h2>Theme</h2>
      <label>
        <select id="theme">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </section>

    <section>
      <h2>Claude project</h2>
      <p class="muted">Open your Claude Project to run the evening review. Scheduled tasks (set up there) trigger automatically at 22:00.</p>
    </section>
  `;

  document.getElementById("signin").addEventListener("click", async () => {
    await signIn({ interactive: true });
    reload();
  });
  document.getElementById("signout").addEventListener("click", () => {
    signOut();
    reload();
  });
  document.getElementById("manual-sync").addEventListener("click", () => {
    reload();
  });
  document.getElementById("export-log").addEventListener("click", () => {
    const text = state.log.text;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-backup-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const themeSel = document.getElementById("theme");
  themeSel.value = localStorage.getItem("tlpwa:theme") || "system";
  themeSel.addEventListener("change", () => {
    localStorage.setItem("tlpwa:theme", themeSel.value);
    applyTheme(themeSel.value);
  });
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

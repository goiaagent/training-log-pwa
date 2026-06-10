import { config } from "../../config.js";
import { getLogText, saveLogText, getGhToken, saveGhToken, clearGhToken } from "../storage.js";
import { EMPTY_LOG_TEMPLATE } from "../log-builder.js";
import { pushLogToGitHub } from "../github.js";

export function renderSettings(root, state, { reload }) {
  const ghToken = getGhToken();
  root.innerHTML = `
    <section>
      <h2>GitHub sync</h2>
      <p class="muted">${
        ghToken
          ? "Token saved. Sessions push to GitHub automatically on save — no manual upload needed. Just tell Claude to run the review."
          : "Paste a fine-grained PAT (repo: <code>" + esc(config.githubRepo) + "</code>, permission: Contents read/write). Sessions then push automatically on save."
      }</p>
      ${
        ghToken
          ? `<button id="gh-sync-now">⬆️ Sync to GitHub now</button>
             <button id="gh-clear">Remove token</button>`
          : `<input type="password" id="gh-token-input" placeholder="github_pat_…" style="width:100%;padding:.5rem;margin-bottom:.5rem">
             <button id="gh-save">Save token</button>`
      }
      <div id="gh-status" class="muted"></div>
    </section>

    <section>
      <h2>Manual sync (fallback)</h2>
      <p class="muted">If GitHub sync is off: tap <strong>Download log.md</strong> and attach the file to your Claude chat for review.</p>
      <button id="export-log">📥 Download log.md</button>
      <button id="refresh-remote">🔄 Refresh adjustments from GitHub</button>
    </section>

    <section>
      <h2>Remote source</h2>
      <p>GitHub raw log: <code style="font-size:.75rem;word-break:break-all">${esc(config.githubRawLogUrl)}</code></p>
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
      <h2>Danger</h2>
      <button id="reset-log" style="background:#a33">Reset local log (lose all sessions)</button>
    </section>
  `;

  const ghStatus = document.getElementById("gh-status");
  document.getElementById("gh-save")?.addEventListener("click", () => {
    const v = document.getElementById("gh-token-input").value.trim();
    if (!v) return;
    saveGhToken(v);
    renderSettings(root, state, { reload });
  });
  document.getElementById("gh-clear")?.addEventListener("click", () => {
    clearGhToken();
    renderSettings(root, state, { reload });
  });
  document.getElementById("gh-sync-now")?.addEventListener("click", async () => {
    ghStatus.textContent = "Syncing…";
    try {
      const r = await pushLogToGitHub();
      ghStatus.textContent = r.skipped ? "Nothing to sync." : "✓ Synced to GitHub";
    } catch (e) {
      ghStatus.textContent = `✗ ${e.message}`;
    }
  });

  document.getElementById("export-log").addEventListener("click", () => {
    const text = getLogText() || state.log.text;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("refresh-remote").addEventListener("click", () => {
    reload();
  });

  document.getElementById("reset-log").addEventListener("click", () => {
    if (confirm("Reset local log? All saved sessions on this device will be lost.")) {
      saveLogText(EMPTY_LOG_TEMPLATE);
      reload();
    }
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

import { config } from "../../config.js";
import { getLogText, saveLogText } from "../storage.js";
import { EMPTY_LOG_TEMPLATE } from "../log-builder.js";

export function renderSettings(root, state, { reload }) {
  root.innerHTML = `
    <section>
      <h2>Sync with Claude</h2>
      <p class="muted">After today's session: tap <strong>Download log.md</strong>, attach the file to your Claude chat for review. Claude commits adjustments back to GitHub; the PWA refreshes them automatically on next launch.</p>
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

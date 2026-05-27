import { renderToday } from "./views/today.js";
import { renderLog } from "./views/log.js";
import { renderAdjust } from "./views/adjust.js";
import { renderReviews } from "./views/reviews.js";
import { renderSettings } from "./views/settings.js";
import { renderEditRecent } from "./views/edit-recent.js";
import { loadLog, loadProgram } from "./drive.js";
import { parseLog } from "./log-parser.js";
import { programDayInfo } from "./program-index.js";
import { getValidToken, signIn } from "./auth.js";

const main = document.getElementById("app-main");
const headerTitle = document.getElementById("header-title");

const state = {
  log: null,         // { fileId, text, etag, parsed }
  programText: null, // raw markdown
  day: null,         // { dayIndex, week, phase, dayOfWeek, sessionKeys }
};

async function bootstrap() {
  state.day = programDayInfo();

  // If no valid token, show sign-in button and wait for user tap.
  if (!getValidToken()) {
    main.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:1.5rem">
      <div style="font-size:2rem">🏋️</div>
      <p style="margin:0;color:var(--text-secondary)">Sign in to load your training data</p>
      <button id="sign-in-btn" style="padding:.75rem 2rem;font-size:1rem;border-radius:.5rem;background:var(--accent);color:#fff;border:none;cursor:pointer">Sign in with Google</button>
    </div>`;
    document.getElementById("sign-in-btn").addEventListener("click", async () => {
      try {
        await signIn({ interactive: true });
        main.innerHTML = `<div id="loading">Loading…</div>`;
        await loadAndRender();
      } catch (err) {
        main.innerHTML = `<div class="error"><p>Sign in failed: ${escapeHtml(err.message)}</p><button id="retry">Retry</button></div>`;
        document.getElementById("retry").addEventListener("click", () => location.reload());
      }
    });
    return;
  }

  await loadAndRender();
}

async function loadAndRender() {
  try {
    const log = await loadLog();
    state.log = { ...log, parsed: parseLog(log.text) };
  } catch (err) {
    main.innerHTML = `<div class="error">
      <p>Couldn't load Drive. ${escapeHtml(err.message)}</p>
      <button id="retry">Retry</button>
    </div>`;
    document.getElementById("retry").addEventListener("click", () => location.reload());
    return;
  }
  route();
}

function route() {
  const hash = location.hash || "#/today";
  const view = hash.replace("#/", "");
  const renderers = {
    today: renderToday,
    log: renderLog,
    adjust: renderAdjust,
    reviews: renderReviews,
    settings: renderSettings,
    "edit-recent": renderEditRecent,
  };
  const fn = renderers[view] || renderToday;
  setActiveTab(view);
  fn(main, state, { reload: bootstrap, navigate });
}

function setActiveTab(view) {
  document.querySelectorAll("#app-tabs a").forEach((a) => {
    a.classList.toggle("active", a.dataset.view === view);
  });
  const titles = {
    today: `${dayLabel(state.day?.dayOfWeek)} · Wk ${state.day?.week} · Phase ${state.day?.phase}`,
    log: "Session log",
    adjust: "Adjustments & Watchlist",
    reviews: "Claude reviews",
    settings: "Settings",
  };
  headerTitle.textContent = titles[view] || "—";
}

function dayLabel(dow) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow] || "?";
}

function navigate(view) {
  location.hash = `#/${view}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

window.addEventListener("hashchange", route);
document.getElementById("header-settings").addEventListener("click", () => navigate("settings"));

bootstrap();

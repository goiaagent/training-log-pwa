import { renderToday } from "./views/today.js";
import { renderLog } from "./views/log.js";
import { renderAdjust } from "./views/adjust.js";
import { renderReviews } from "./views/reviews.js";
import { renderSettings } from "./views/settings.js";
import { renderEditRecent } from "./views/edit-recent.js";
import { renderGraph } from "./views/graph.js";
import { parseLog } from "./log-parser.js";
import { programDayInfo } from "./program-index.js";
import { getLogText, saveLogText } from "./storage.js";
import { EMPTY_LOG_TEMPLATE } from "./log-builder.js";
import { fetchRemoteLog, mergeRemoteIntoLocal } from "./remote.js";

const main = document.getElementById("app-main");
const headerTitle = document.getElementById("header-title");

const state = {
  log: null, // { text, parsed }
  day: null,
};

async function bootstrap() {
  state.day = programDayInfo();

  // Load local log (or seed with template on first run).
  let localText = getLogText();
  if (!localText) {
    localText = EMPTY_LOG_TEMPLATE;
    saveLogText(localText);
  }
  setStateFromText(localText);
  route(); // render immediately from local

  // Refresh adjustments/reviews from GitHub in the background.
  const remoteText = await fetchRemoteLog();
  if (remoteText) {
    const merged = mergeRemoteIntoLocal(localText, remoteText);
    if (merged !== localText) {
      saveLogText(merged);
      setStateFromText(merged);
      route();
    }
  }
}

function setStateFromText(text) {
  state.log = { text, parsed: parseLog(text) };
}

function route() {
  const hash = location.hash || "#/today";
  // Strip query string for view-name match.
  const view = hash.replace("#/", "").split("?")[0];
  const renderers = {
    today: renderToday,
    log: renderLog,
    adjust: renderAdjust,
    reviews: renderReviews,
    settings: renderSettings,
    "edit-recent": renderEditRecent,
    graph: renderGraph,
  };
  const fn = renderers[view] || renderToday;
  setActiveTab(view);
  fn(main, state, { reload: refresh, navigate });
}

async function refresh() {
  const localText = getLogText() || EMPTY_LOG_TEMPLATE;
  setStateFromText(localText);
  const remoteText = await fetchRemoteLog();
  if (remoteText) {
    const merged = mergeRemoteIntoLocal(localText, remoteText);
    if (merged !== localText) {
      saveLogText(merged);
      setStateFromText(merged);
    }
  }
  route();
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

window.addEventListener("hashchange", route);
document.getElementById("header-settings").addEventListener("click", () => navigate("settings"));

bootstrap();

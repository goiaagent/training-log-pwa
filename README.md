# Training Log PWA

Phone-first PWA for daily workout logging, paired with Claude for evening
analysis and load calibration. Live at
**https://goiaagent.github.io/training-log-pwa/**.

## Architecture (one paragraph)

The PWA stores sessions in localStorage as a single rolling `log.md` blob.
On save it pushes that file to this repo via the GitHub Contents API
(fine-grained PAT, pasted once in Settings). Claude reads `log.md` from the
repo, analyzes the day's training against the program (`js/program-index.js`),
and commits back **Active Adjustments**, **Watchlist**, and **Daily/Weekly
Reviews**. On next launch the PWA fetches the raw `log.md`, merges (local owns
Sessions, remote owns everything else), and today's prescribed values reflect
Claude's calibration. No backend, no OAuth, no build step.

## Daily usage

1. Open the PWA (home-screen icon) → fill today's session → **Save**
   (auto-syncs to GitHub).
2. Tell Claude to run the review; confirm the proposed adjustments with `y`.
3. Next morning the PWA shows the calibrated loads.

Fallback if GitHub sync is off: Settings → **Download log.md** → attach the
file to the Claude chat (or drop it in the shared Drive folder).

## Setup (new device)

1. Open the URL → Add to Home Screen.
2. Settings → GitHub sync → paste a fine-grained PAT
   (this repo only, permission: **Contents read/write**).

Note: local sessions live in this device's localStorage. The GitHub `log.md`
is the backup — a new device starts from the remote copy on first merge.

## Development

```bash
npm install
npx vitest run                       # unit tests (pure-logic modules)
npx http-server -p 8080 --cors -c-1  # local dev server
```

Deploy = push to `main` (GitHub Pages serves the repo root).
**Any change to shell files requires bumping `CACHE` in `sw.js`**, or
returning clients will run stale code.

See `CLAUDE.md` for the data model, the per-set schema, and the analysis
protocol; `docs/claude-system-prompt.md` for the review rules (RPE guardrails,
deload weeks, adjustment format).

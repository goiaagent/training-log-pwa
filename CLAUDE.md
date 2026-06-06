# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A phone-first PWA for logging workouts from a fixed 22-week hybrid-athlete program. Static HTML/ESM/CSS — no build step. Deployed to GitHub Pages from `main`. Paired with a Claude Project (or chat sessions) that reads the user's log file and writes back load adjustments. The PWA reads those adjustments on next launch and overlays them on prescribed values.

## Commands

```bash
# Tests (Vitest, pure-logic modules only — no DOM tests)
npx vitest run
npx vitest run tests/log-parser.test.js          # single file
npx vitest run -t "parses setRows"                # by test name

# Local dev — serve the static files (no bundler)
npx http-server -p 8080 --cors -c-1
# Then open http://localhost:8080. Sign-in flow is gone (localStorage only).

# Deploy = git push to main. GitHub Pages serves https://goiaagent.github.io/training-log-pwa/.
# Verify the deploy:
gh api repos/goiaagent/training-log-pwa/pages | jq -r .status
curl -sI https://goiaagent.github.io/training-log-pwa/ | head -1
```

## The 3-tier data model

Understanding this is required for any non-trivial change.

1. **PWA localStorage** (key `tlpwa:log`) is the canonical source for **Sessions**. The user writes here; nothing else does.
2. **GitHub raw `log.md`** (`https://raw.githubusercontent.com/goiaagent/training-log-pwa/main/log.md`) is the canonical source for **Active Adjustments**, **Watchlist**, **Daily Reviews**, **Weekly Reviews**. Only Claude writes here (via git commits to this repo).
3. **Google Drive folder** is the analysis exchange. User uploads a `log-YYYY-MM-DD.md` export from the PWA; Claude reads it via the Drive MCP and replies with an `analysis-YYYY-MM-DD.md` (review-only, no Sessions duplication) + a GitHub commit updating `log.md`.

The merge happens in `js/remote.js` → `mergeRemoteIntoLocal()`: takes Sessions from local text, everything else from remote text. Local sessions are never lost; remote adjustments always win.

## Per-set schema (`set_table` field kind)

The single most invasive concept in the codebase. A `weighted_reps` / `weighted_time` / etc. block does **not** store flat `{reps, load_kg}` — it stores `{setRows: [{reps, load_kg}, {reps, load_kg}, ...], rpe, notes}` where each row = one set. Any change touching exercise data ripples through:

- `js/exercise-types.js` — `TYPES` map. `set_table` fields declare `columns: [{name, kind, label}]`. `validateEntry` walks each row and each column.
- `js/log-builder.js` — `renderBlock()` emits `- Set N: col: v · col: v` lines.
- `js/log-parser.js` — `parseSessions()` regex-matches `^- Set N:` lines back into `setRows`.
- `js/views/today.js` — `addSetRow()` builds DOM rows; `extractDraft()` reads them; `hydrateDraft()` restores from localStorage; `coerceEntryTypes()` casts strings → numbers per column kind.
- `js/views/edit-recent.js` — separate render + extract path for the edit-within-24h flow.

Climbing types (`climbing_project`, `climbing_arc`, etc.) and running types do **not** use `set_table`. Don't try to retrofit them.

## Program structure (`js/program-index.js`)

`SESSIONS` map is keyed by `monday_am`, `monday_pm`, `tuesday`, `wednesday_am`, `wednesday_pm`, `thursday`, `friday`, `saturday`, `sunday`. `DAY_OF_WEEK_TO_SESSIONS` maps `Date.getDay()` to one or two session keys.

Each block has an `id` (e.g. `kilterboard-4x4`), a `type` (matches a key in `TYPES`), and `prescriptions: {1, 2, 3, 4}` keyed by **phase** (1-4). `programDayInfo()` computes phase from week: 1-6 → P1, 7-14 → P2, 15-20 → P3, 21+ → P4.

The block `id` is the **join key for adjustments**: an adjustment with key `kilterboard-4x4.problems_per_block` overrides that field for that block. `js/prescribed.js` does the resolution.

## SW cache discipline

Service worker is `sw.js`. Any change to shell files (`config.js`, anything in `js/`, `css/`, `index.html`) **requires bumping the `CACHE` version constant** (currently `tlpwa-vN`). Without a bump, returning users will run stale code from cache even after a deploy. The user has had to clear site data multiple times because of this — don't skip the bump.

If you add a new module under `js/`, also add it to the `SHELL` array in `sw.js`.

## The analysis protocol

When asked to review a session:

1. Read the user's log (from Drive MCP, attached file, or pasted content).
2. Cross-reference each block's actual vs. prescribed (from `program-index.js` + current phase).
3. **Propose** adjustments + watchlist updates + a daily review entry by writing into local `log.md` — do NOT commit yet.
4. Present the proposal in chat. Wait for the user to confirm with `y` (or revise).
5. On confirmation: `git add log.md && git commit && git push`. The PWA picks up the new `log.md` from the GitHub raw URL on next launch / refresh.
6. Optionally upload an `analysis-YYYY-MM-DD.md` artifact to the user's Drive folder (review-only, not the full log) via `mcp__ed106803-7f48-428e-9ba3-8651da7f3d55__create_file`.

Adjustment line format is fixed and is consumed by `log-parser.js` → `parseAdjustments`:
```
- **<block-id>.<field>** — <value>. Reason: <…>. Auto-expire: <ISO-date | condition>. (set <ISO-date>)
```

Never edit the `## Sessions` section in `log.md` — it's the user's data. Only Active Adjustments / Watchlist / Daily Reviews / Weekly Reviews are Claude-owned.

## Files to read first when changing exercise data

1. `js/exercise-types.js` — field schema
2. `js/program-index.js` — prescriptions per phase
3. `js/log-builder.js` + `js/log-parser.js` — markdown round-trip (run `npx vitest run tests/log-builder.test.js tests/log-parser.test.js` after any change here)
4. `js/views/today.js` — heaviest file, handles rendering + draft persistence + save

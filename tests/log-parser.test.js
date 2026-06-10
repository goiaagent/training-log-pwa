import { describe, it, expect } from "vitest";
import { parseLog } from "../js/log-parser.js";

const SAMPLE = `# Hybrid Athlete Training Log

**Program start:** 2026-05-14
**Last updated:** 2026-07-15 22:14

## Active Adjustments

- **fingerboard-maxhangs.load_kg** — 35 (was program 37.5). Reason: RPE 9 last Mon.
  Auto-expire: next clean Mon session. (set 2026-07-14)
- **shoulder-er-pos1.exercise** — "band side-lying" (was DB). Auto-expire: 2026-07-21. (set 2026-07-15)

## Watchlist

- **sleep** — <6h logged 3 of last 5 days. If tonight <6h, skip Tue Block B plyos.
- **left A2** — mild stiffness 2026-07-12. Re-palpate Fri.

## Sessions

### 2026-07-15 — Tue — Lower Power + Nordics + Plyos
**Phase:** 2 · **Week:** 10 · **Sleep prev night:** 7.5h · **Mood:** 4/5 · **Body:** quads sore

**Block A — Nordic curls** _(tempo_eccentric)_
- variation: ecc-only · sets: 3 · reps: 5 · eccentric_seconds: 5 · rpe: 7
- Notes: Clean, ready to advance.

**Global notes:** Felt strong.

### 2026-07-14 — Mon — Climbing Strength
**Phase:** 2 · **Week:** 10 · **Sleep prev night:** 7h · **Mood:** 4/5 · **Body:** —

**Block B — Fingerboard MaxHangs** _(weighted_time)_
- load_kg: 35 · sets: 4 · hold_seconds: 8 · rpe: 9
- Notes: Heavy, form broke set 4.

**Global notes:** Tough session.

## Daily Reviews

### 2026-07-15 — Tue Wk 10
**Summary:** Solid lower session.
**Calibration:** Nordic → 3×6 next week.

## Weekly Reviews

### Week 10 (2026-07-13 to 2026-07-19)
**Adherence:** 5/5 sessions.
`;

describe("log-parser", () => {
  it("parses Active Adjustments with key, value, and expire", () => {
    const parsed = parseLog(SAMPLE);
    expect(parsed.adjustments).toHaveLength(2);
    const adj = parsed.adjustments[0];
    expect(adj.key).toBe("fingerboard-maxhangs.load_kg");
    expect(adj.raw).toContain("35");
    expect(adj.expire).toBe("next clean Mon session");
    expect(adj.set).toBe("2026-07-14");
  });

  it("parses Watchlist entries", () => {
    const parsed = parseLog(SAMPLE);
    expect(parsed.watchlist).toHaveLength(2);
    expect(parsed.watchlist[0].topic).toBe("sleep");
  });

  it("parses Sessions in reverse-chronological order", () => {
    const parsed = parseLog(SAMPLE);
    expect(parsed.sessions).toHaveLength(2);
    expect(parsed.sessions[0].date).toBe("2026-07-15");
    expect(parsed.sessions[1].date).toBe("2026-07-14");
  });

  it("parses session metadata (phase, week, sleep, mood)", () => {
    const parsed = parseLog(SAMPLE);
    const s = parsed.sessions[0];
    expect(s.phase).toBe(2);
    expect(s.week).toBe(10);
    expect(s.sleep_h).toBe(7.5);
    expect(s.mood).toBe(4);
  });

  it("parses session blocks with type and entry fields", () => {
    const parsed = parseLog(SAMPLE);
    const block = parsed.sessions[0].blocks[0];
    expect(block.label).toBe("A");
    expect(block.exercise).toBe("Nordic curls");
    expect(block.type).toBe("tempo_eccentric");
    expect(block.entry.variation).toBe("ecc-only");
    expect(block.entry.sets).toBe(3);
    expect(block.entry.reps).toBe(5);
    expect(block.entry.rpe).toBe(7);
    expect(block.entry.notes).toBe("Clean, ready to advance.");
  });

  it("keeps daily and weekly reviews as raw markdown", () => {
    const parsed = parseLog(SAMPLE);
    expect(parsed.dailyReviewsRaw).toContain("### 2026-07-15 — Tue Wk 10");
    expect(parsed.weeklyReviewsRaw).toContain("### Week 10");
  });

  it("parses soreness from the meta line", () => {
    const text = `# Log
## Active Adjustments
## Watchlist
## Sessions
### 2026-06-10 — Wed — S
**Phase:** 1 · **Week:** 3 · **Sleep prev night:** 8h · **Mood:** 3/5 · **Soreness:** 2/5 · **Body:** —

## Daily Reviews
## Weekly Reviews
`;
    const parsed = parseLog(text);
    expect(parsed.sessions[0].soreness).toBe(2);
    expect(parsed.sessions[0].mood).toBe(3);
  });

  it("parses setRows from per-set lines", () => {
    const text = `# Log
## Active Adjustments
## Watchlist
## Sessions
### 2026-07-15 — Tue — S
**Phase:** 1 · **Week:** 1 · **Sleep prev night:** 7h · **Mood:** 4/5 · **Body:** —

**Block A — Back squat** _(weighted_reps)_
- Set 1: reps: 5 · load_kg: 80
- Set 2: reps: 5 · load_kg: 80
- Set 3: reps: 4 · load_kg: 75
- rpe: 8
- Notes: hard 3rd set

## Daily Reviews
## Weekly Reviews
`;
    const parsed = parseLog(text);
    const block = parsed.sessions[0].blocks[0];
    expect(block.entry.setRows).toHaveLength(3);
    expect(block.entry.setRows[0]).toEqual({ reps: 5, load_kg: 80 });
    expect(block.entry.setRows[2]).toEqual({ reps: 4, load_kg: 75 });
    expect(block.entry.rpe).toBe(8);
    expect(block.entry.notes).toBe("hard 3rd set");
  });

  it("handles an empty log gracefully", () => {
    const empty = `# Hybrid Athlete Training Log

## Active Adjustments

## Watchlist

## Sessions

## Daily Reviews

## Weekly Reviews
`;
    const parsed = parseLog(empty);
    expect(parsed.adjustments).toEqual([]);
    expect(parsed.watchlist).toEqual([]);
    expect(parsed.sessions).toEqual([]);
  });
});

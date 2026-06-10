import { describe, it, expect } from "vitest";
import { buildSessionMarkdown, insertSession, EMPTY_LOG_TEMPLATE } from "../js/log-builder.js";

describe("log-builder", () => {
  it("builds a session markdown block from structured data", () => {
    const md = buildSessionMarkdown({
      date: "2026-07-15",
      dayOfWeek: "Tue",
      name: "Lower Power + Nordics + Plyos",
      phase: 2,
      week: 10,
      sleep_h: 7.5,
      mood: 4,
      body: "quads sore",
      blocks: [
        {
          label: "A",
          exercise: "Nordic curls",
          type: "tempo_eccentric",
          entry: {
            variation: "ecc-only",
            sets: 3,
            reps: 5,
            eccentric_seconds: 5,
            rpe: 7,
            notes: "Clean, ready to advance.",
          },
        },
      ],
      globalNotes: "Felt strong.",
    });
    expect(md).toContain("### 2026-07-15 — Tue — Lower Power + Nordics + Plyos");
    expect(md).toContain("**Phase:** 2 · **Week:** 10");
    expect(md).toContain("Sleep prev night:** 7.5h");
    expect(md).toContain("**Block A — Nordic curls** _(tempo_eccentric)_");
    expect(md).toContain("variation: ecc-only · sets: 3 · reps: 5 · eccentric_seconds: 5 · rpe: 7");
    expect(md).toContain("- Notes: Clean, ready to advance.");
    expect(md).toContain("**Global notes:** Felt strong.");
  });

  it("omits notes line when entry has no notes", () => {
    const md = buildSessionMarkdown({
      date: "2026-07-15",
      dayOfWeek: "Tue",
      name: "Session",
      phase: 1,
      week: 1,
      sleep_h: 7,
      mood: 3,
      body: "—",
      blocks: [
        {
          label: "A",
          exercise: "Pull-ups",
          type: "weighted_reps",
          entry: { load_kg: 20, sets: 3, reps: 8, rpe: 7 },
        },
      ],
      globalNotes: "",
    });
    expect(md).not.toContain("- Notes:");
  });

  it("inserts session at top of ## Sessions section", () => {
    const existing = EMPTY_LOG_TEMPLATE;
    const sessionMd = "### 2026-07-15 — Tue — Demo\n**Phase:** 1 · **Week:** 1\n";
    const result = insertSession(existing, sessionMd, "2026-07-15 22:14");
    const sessionsIdx = result.indexOf("## Sessions");
    const dailyIdx = result.indexOf("## Daily Reviews");
    const insertedIdx = result.indexOf("### 2026-07-15 — Tue — Demo");
    expect(insertedIdx).toBeGreaterThan(sessionsIdx);
    expect(insertedIdx).toBeLessThan(dailyIdx);
    expect(result).toContain("**Last updated:** 2026-07-15 22:14");
  });

  it("preserves existing sessions when inserting new one", () => {
    const existing = EMPTY_LOG_TEMPLATE.replace(
      "## Sessions\n",
      "## Sessions\n\n### 2026-07-14 — Mon — Old\n**Phase:** 1 · **Week:** 1\n",
    );
    const newMd = "### 2026-07-15 — Tue — New\n**Phase:** 1 · **Week:** 1\n";
    const result = insertSession(existing, newMd, "2026-07-15 22:14");
    const newIdx = result.indexOf("New");
    const oldIdx = result.indexOf("Old");
    expect(newIdx).toBeGreaterThan(-1);
    expect(oldIdx).toBeGreaterThan(newIdx);
  });

  it("includes soreness in the meta line when provided", () => {
    const md = buildSessionMarkdown({
      date: "2026-06-10",
      dayOfWeek: "Wed",
      name: "S",
      phase: 1,
      week: 3,
      sleep_h: 8,
      mood: 3,
      soreness: 2,
      body: "—",
      blocks: [],
      globalNotes: "",
    });
    expect(md).toContain("**Mood:** 3/5 · **Soreness:** 2/5 · **Body:**");
  });

  it("omits soreness when not provided (backward compat)", () => {
    const md = buildSessionMarkdown({
      date: "2026-06-10",
      dayOfWeek: "Wed",
      name: "S",
      phase: 1,
      week: 3,
      sleep_h: 8,
      mood: 3,
      body: "—",
      blocks: [],
      globalNotes: "",
    });
    expect(md).not.toContain("Soreness");
  });

  it("serializes setRows as per-set lines", () => {
    const md = buildSessionMarkdown({
      date: "2026-07-15",
      dayOfWeek: "Tue",
      name: "S",
      phase: 1,
      week: 1,
      sleep_h: 7,
      mood: 4,
      body: "—",
      blocks: [
        {
          label: "A",
          exercise: "Back squat",
          type: "weighted_reps",
          entry: {
            setRows: [
              { reps: 5, load_kg: 80 },
              { reps: 5, load_kg: 80 },
              { reps: 4, load_kg: 75 },
            ],
            rpe: 8,
          },
        },
      ],
      globalNotes: "",
    });
    expect(md).toContain("- Set 1: reps: 5 · load_kg: 80");
    expect(md).toContain("- Set 2: reps: 5 · load_kg: 80");
    expect(md).toContain("- Set 3: reps: 4 · load_kg: 75");
    expect(md).toContain("rpe: 8");
  });

  it("EMPTY_LOG_TEMPLATE contains all required sections", () => {
    expect(EMPTY_LOG_TEMPLATE).toContain("## Active Adjustments");
    expect(EMPTY_LOG_TEMPLATE).toContain("## Watchlist");
    expect(EMPTY_LOG_TEMPLATE).toContain("## Sessions");
    expect(EMPTY_LOG_TEMPLATE).toContain("## Daily Reviews");
    expect(EMPTY_LOG_TEMPLATE).toContain("## Weekly Reviews");
  });
});

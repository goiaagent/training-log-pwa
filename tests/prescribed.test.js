import { describe, it, expect } from "vitest";
import { resolvePrescribed, isAdjustmentActive } from "../js/prescribed.js";

const programBlock = {
  id: "fingerboard-maxhangs",
  type: "weighted_time",
  name: "Fingerboard MaxHangs (20mm)",
  prescriptions: {
    1: { load_kg: 35, sets: 4, hold_seconds: 8 },
    2: { load_kg: 37.5, sets: 4, hold_seconds: 8 },
    3: { load_kg: 40, sets: 4, hold_seconds: 7 },
    4: { load_kg: 37.5, sets: 3, hold_seconds: 7 },
  },
};

describe("prescribed", () => {
  it("returns program prescription when no adjustments match", () => {
    const result = resolvePrescribed(programBlock, 2, [], new Date("2026-07-15"));
    expect(result.values).toEqual({ load_kg: 37.5, sets: 4, hold_seconds: 8 });
    expect(result.overrides).toEqual([]);
  });

  it("applies a matching adjustment to the right field", () => {
    const adjustments = [
      {
        key: "fingerboard-maxhangs.load_kg",
        raw: "35 (was 37.5)",
        expire: "next clean Mon session",
        set: "2026-07-14",
      },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(35);
    expect(result.values.sets).toBe(4); // unchanged
    expect(result.overrides).toHaveLength(1);
    expect(result.overrides[0].field).toBe("load_kg");
  });

  it("ignores adjustments for other exercises", () => {
    const adjustments = [
      { key: "weighted-pullups.load_kg", raw: "20", expire: null, set: "2026-07-14" },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(37.5);
    expect(result.overrides).toEqual([]);
  });

  it("respects ISO auto-expire dates (past expire = inactive)", () => {
    const adjustments = [
      { key: "fingerboard-maxhangs.load_kg", raw: "35", expire: "2026-07-10", set: "2026-07-01" },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(37.5);
    expect(result.overrides).toEqual([]);
  });

  it("respects ISO auto-expire dates (future expire = active)", () => {
    const adjustments = [
      { key: "fingerboard-maxhangs.load_kg", raw: "35", expire: "2026-07-21", set: "2026-07-14" },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(35);
  });

  it("treats non-date expire phrases as active (Claude condition)", () => {
    const adjustments = [
      { key: "fingerboard-maxhangs.load_kg", raw: "35", expire: "next clean Mon session", set: "2026-07-14" },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(35);
  });

  it("parses numeric values from raw adjustment string", () => {
    const adjustments = [
      { key: "fingerboard-maxhangs.load_kg", raw: "32.5 (was 35)", expire: null, set: "2026-07-14" },
    ];
    const result = resolvePrescribed(programBlock, 2, adjustments, new Date("2026-07-15"));
    expect(result.values.load_kg).toBe(32.5);
  });

  it("isAdjustmentActive — handles ISO dates and condition strings", () => {
    expect(isAdjustmentActive({ expire: "2026-07-21" }, new Date("2026-07-15"))).toBe(true);
    expect(isAdjustmentActive({ expire: "2026-07-10" }, new Date("2026-07-15"))).toBe(false);
    expect(isAdjustmentActive({ expire: "next clean Mon" }, new Date("2026-07-15"))).toBe(true);
    expect(isAdjustmentActive({ expire: null }, new Date("2026-07-15"))).toBe(true);
  });
});

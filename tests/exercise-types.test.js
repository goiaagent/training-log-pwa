import { describe, it, expect } from "vitest";
import { TYPES, fieldsFor, validateEntry } from "../js/exercise-types.js";

describe("exercise-types", () => {
  it("exposes all type identifiers used by the program", () => {
    expect(Object.keys(TYPES).sort()).toEqual([
      "bodyweight_reps_per_side",
      "bodyweight_time",
      "climbing_arc",
      "climbing_kilterboard",
      "climbing_project",
      "plyo",
      "running_time_trial",
      "running_z2",
      "shoulder_er",
      "tempo_eccentric",
      "weighted_reps",
      "weighted_time",
      "weighted_time_asymmetric",
    ]);
  });

  it("weighted_reps uses a set_table field", () => {
    const fields = fieldsFor("weighted_reps");
    const setRows = fields.find((f) => f.name === "setRows");
    expect(setRows).toBeDefined();
    expect(setRows.kind).toBe("set_table");
    expect(setRows.columns.map((c) => c.name).sort()).toEqual(["load_kg", "reps"]);
  });

  it("weighted_time_asymmetric set_table has both sides", () => {
    const fields = fieldsFor("weighted_time_asymmetric");
    const setRows = fields.find((f) => f.name === "setRows");
    const cols = setRows.columns.map((c) => c.name);
    expect(cols).toContain("hold_s_left");
    expect(cols).toContain("hold_s_right");
  });

  it("validateEntry passes for a complete weighted_reps entry", () => {
    const result = validateEntry("weighted_reps", {
      setRows: [
        { reps: 7, load_kg: 25 },
        { reps: 6, load_kg: 25 },
      ],
      rpe: 8,
      notes: "clean",
    });
    expect(result.ok).toBe(true);
  });

  it("validateEntry fails when set_table empty", () => {
    const result = validateEntry("weighted_reps", { setRows: [], rpe: 8 });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("setRows");
  });

  it("validateEntry fails when a set row is missing a column", () => {
    const result = validateEntry("weighted_reps", {
      setRows: [{ reps: 5 }],
      rpe: 7,
    });
    expect(result.ok).toBe(false);
    expect(result.missing.some((m) => m.includes("load_kg"))).toBe(true);
  });

  it("plyo height_cm and load_vest_kg are optional block-level fields", () => {
    const result = validateEntry("plyo", {
      setRows: [{ reps: 8 }, { reps: 6 }],
      rpe: 7,
    });
    expect(result.ok).toBe(true);
  });
});

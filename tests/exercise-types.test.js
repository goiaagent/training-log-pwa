import { describe, it, expect } from "vitest";
import { TYPES, fieldsFor, validateEntry } from "../js/exercise-types.js";

describe("exercise-types", () => {
  it("exposes all 15 type identifiers", () => {
    expect(Object.keys(TYPES).sort()).toEqual([
      "bodyweight_reps_per_side",
      "bodyweight_time",
      "climbing_arc",
      "climbing_kilterboard",
      "climbing_project",
      "mobility",
      "plyo",
      "running_hyrox",
      "running_time_trial",
      "running_z2",
      "shoulder_er",
      "tempo_eccentric",
      "weighted_reps",
      "weighted_time",
      "weighted_time_asymmetric",
    ]);
  });

  it("returns field metadata for weighted_reps", () => {
    const fields = fieldsFor("weighted_reps");
    const names = fields.map((f) => f.name);
    expect(names).toEqual(["load_kg", "sets", "reps", "rpe", "notes"]);
  });

  it("returns field metadata for weighted_time_asymmetric", () => {
    const fields = fieldsFor("weighted_time_asymmetric");
    const names = fields.map((f) => f.name);
    expect(names).toContain("hold_s_left");
    expect(names).toContain("hold_s_right");
  });

  it("validateEntry passes for a complete weighted_reps entry", () => {
    const result = validateEntry("weighted_reps", {
      load_kg: 25,
      sets: 4,
      reps: 7,
      rpe: 8,
      notes: "clean",
    });
    expect(result.ok).toBe(true);
  });

  it("validateEntry fails when required field missing", () => {
    const result = validateEntry("weighted_reps", { sets: 4, reps: 7, rpe: 8 });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("load_kg");
  });

  it("validateEntry treats optional fields as optional", () => {
    const result = validateEntry("plyo", { sets: 3, reps: 8, rpe: 7 });
    expect(result.ok).toBe(true); // height_cm and load_vest_kg are optional
  });
});

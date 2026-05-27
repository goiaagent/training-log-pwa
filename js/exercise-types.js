// Field metadata per exercise type. The PWA renderer reads this to build
// the per-block form. log-builder consults it to know which fields to write.
//
// Field shape: { name, kind, required, label, unit? }
// - kind: "number" | "integer" | "text" | "rpe" | "enum"
// - required: true | false
// - For enum kind, add `options: string[]`.

const FIELD = (name, kind, required, label, extra = {}) => ({
  name,
  kind,
  required,
  label,
  ...extra,
});

export const TYPES = {
  weighted_reps: [
    FIELD("load_kg", "number", true, "Load (kg)"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("reps", "integer", true, "Reps"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  weighted_time: [
    FIELD("load_kg", "number", true, "Load (kg)"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("hold_seconds", "number", true, "Hold (sec)"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  weighted_time_asymmetric: [
    FIELD("load_kg", "number", true, "Load (kg)"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("hold_s_left", "number", true, "Left hold (sec)"),
    FIELD("hold_s_right", "number", true, "Right hold (sec)"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  bodyweight_time: [
    FIELD("stage", "text", true, "Stage"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("hold_seconds", "number", true, "Hold (sec)"),
    FIELD("notes", "text", false, "Notes"),
  ],
  bodyweight_reps_per_side: [
    FIELD("progression", "text", true, "Progression"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("reps_left", "integer", true, "Reps left"),
    FIELD("reps_right", "integer", true, "Reps right"),
    FIELD("notes", "text", false, "Notes"),
  ],
  plyo: [
    FIELD("sets", "integer", true, "Sets"),
    FIELD("reps", "integer", true, "Reps"),
    FIELD("height_cm", "number", false, "Height (cm)"),
    FIELD("load_vest_kg", "number", false, "Vest (kg)"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  tempo_eccentric: [
    FIELD("variation", "enum", true, "Variation", {
      options: ["ecc-only", "assisted", "full", "loaded"],
    }),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("reps", "integer", true, "Reps"),
    FIELD("eccentric_seconds", "number", true, "Eccentric (sec)"),
    FIELD("load_kg", "number", false, "Load (kg)"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  shoulder_er: [
    FIELD("position", "integer", true, "Position (1-4)"),
    FIELD("load_kg", "number", true, "Load (kg)"),
    FIELD("sets", "integer", true, "Sets"),
    FIELD("reps", "integer", true, "Reps"),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  climbing_project: [
    // attempts is a list rendered specially; not a flat field
    FIELD("attempts", "attempts_list", true, "Attempts"),
    FIELD("session_duration_min", "integer", true, "Duration (min)"),
    FIELD("overall_notes", "text", false, "Notes"),
  ],
  climbing_arc: [
    FIELD("duration_min", "integer", true, "Duration (min)"),
    FIELD("grade_range", "text", true, "Grade range"),
    FIELD("effort_pct", "integer", true, "Effort %"),
    FIELD("falls", "integer", true, "Falls"),
    FIELD("notes", "text", false, "Notes"),
  ],
  climbing_kilterboard: [
    FIELD("angle_deg", "integer", true, "Angle (°)"),
    FIELD("problems_per_block", "integer", true, "Problems/block"),
    FIELD("blocks", "integer", true, "Blocks"),
    FIELD("grade_range", "text", true, "Grade range"),
    FIELD("rest_min_between_blocks", "integer", true, "Rest (min)"),
    FIELD("notes", "text", false, "Notes"),
  ],
  running_z2: [
    FIELD("duration_min", "integer", true, "Duration (min)"),
    FIELD("avg_hr", "integer", false, "Avg HR"),
    FIELD("route", "text", false, "Route"),
    FIELD("notes", "text", false, "Notes"),
  ],
  running_time_trial: [
    FIELD("distance_km", "number", true, "Distance (km)"),
    FIELD("time_min_sec", "text", true, "Time (mm:ss)"),
    FIELD("avg_hr", "integer", false, "Avg HR"),
    FIELD("notes", "text", false, "Notes"),
  ],
  running_hyrox: [
    FIELD("format", "enum", true, "Format", { options: ["A", "B"] }),
    FIELD("total_time_min_sec", "text", true, "Total time (mm:ss)"),
    FIELD("station_splits", "text", false, "Station splits"),
    FIELD("notes", "text", false, "Notes"),
  ],
  mobility: [
    FIELD("duration_min", "integer", true, "Duration (min)"),
    FIELD("focus", "text", false, "Focus"),
    FIELD("notes", "text", false, "Notes"),
  ],
};

export function fieldsFor(type) {
  if (!(type in TYPES)) throw new Error(`Unknown exercise type: ${type}`);
  return TYPES[type];
}

export function validateEntry(type, entry) {
  const fields = fieldsFor(type);
  const missing = [];
  for (const f of fields) {
    if (!f.required) continue;
    const v = entry[f.name];
    if (v === undefined || v === null || v === "") missing.push(f.name);
  }
  return { ok: missing.length === 0, missing };
}

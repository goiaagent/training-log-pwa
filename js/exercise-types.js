// Field metadata per exercise type. The PWA renderer reads this to build
// the per-block form. log-builder consults it to know which fields to write.
//
// Field shape: { name, kind, required, label, unit? }
// - kind: "number" | "integer" | "text" | "rpe" | "enum" | "set_table" | "attempts_list"
// - required: true | false
// - For enum kind, add `options: string[]`.
// - For set_table kind, add `columns: [{name, kind, label}]`. Value is an array
//   of row objects: [{col1: v, col2: v}, ...]. Each row represents one set.

const FIELD = (name, kind, required, label, extra = {}) => ({
  name,
  kind,
  required,
  label,
  ...extra,
});

const COL = (name, kind, label, extra = {}) => ({ name, kind, label, ...extra });

export const TYPES = {
  weighted_reps: [
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("reps", "integer", "Reps"), COL("load_kg", "number", "Load (kg)")],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  weighted_time: [
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("hold_seconds", "number", "Hold (s)"), COL("load_kg", "number", "Load (kg)")],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  weighted_time_asymmetric: [
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [
        COL("hold_s_left", "number", "Left (s)"),
        COL("hold_s_right", "number", "Right (s)"),
        COL("load_kg", "number", "Load (kg)"),
      ],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  bodyweight_time: [
    FIELD("stage", "text", true, "Stage"),
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("hold_seconds", "number", "Hold (s)")],
    }),
    FIELD("notes", "text", false, "Notes"),
  ],
  bodyweight_reps_per_side: [
    FIELD("progression", "text", true, "Progression"),
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("reps_left", "integer", "Reps L"), COL("reps_right", "integer", "Reps R")],
    }),
    FIELD("notes", "text", false, "Notes"),
  ],
  plyo: [
    FIELD("height_cm", "number", false, "Height (cm)"),
    FIELD("load_vest_kg", "number", false, "Vest (kg)"),
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [
        COL("reps", "integer", "Reps (total)"),
        COL("clapping_reps", "integer", "Clapping (subset)", { optional: true }),
      ],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  tempo_eccentric: [
    FIELD("variation", "enum", true, "Variation", {
      options: ["ecc-only", "assisted", "full", "loaded"],
    }),
    FIELD("eccentric_seconds", "number", true, "Eccentric (sec)"),
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("reps", "integer", "Reps"), COL("load_kg", "number", "Load (kg)")],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  shoulder_er: [
    FIELD("position", "integer", true, "Position (1-4)"),
    FIELD("setRows", "set_table", true, "Sets", {
      columns: [COL("reps", "integer", "Reps"), COL("load_kg", "number", "Load (kg)")],
    }),
    FIELD("rpe", "rpe", true, "RPE"),
    FIELD("notes", "text", false, "Notes"),
  ],
  climbing_project: [
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
    FIELD("rest_min_between_blocks", "integer", true, "Rest between blocks (min)"),
    FIELD("setRows", "set_table", true, "Blocks", {
      columns: [
        COL("grade", "text", "Grade (V-scale)"),
        COL("routes_climbed", "integer", "Routes climbed"),
      ],
    }),
    FIELD("rpe", "rpe", false, "Overall RPE"),
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
    if (f.kind === "set_table") {
      if (!Array.isArray(v) || v.length === 0) {
        missing.push(f.name);
        continue;
      }
      // Each row must have all required column values. Optional columns are skipped.
      for (let i = 0; i < v.length; i++) {
        for (const col of f.columns) {
          if (col.optional) continue;
          if (v[i][col.name] === undefined || v[i][col.name] === "" || v[i][col.name] === null) {
            missing.push(`${f.name}[${i + 1}].${col.name}`);
          }
        }
      }
      continue;
    }
    if (v === undefined || v === null || v === "") missing.push(f.name);
  }
  return { ok: missing.length === 0, missing };
}

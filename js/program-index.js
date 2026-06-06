// Program structure derived from hybrid-athlete-program.md.
// Hardcoded for v1. If program changes, regenerate this file.

import { config } from "../config.js";

const MS_PER_DAY = 86400000;

// Day-of-week → session blueprint (exercise list + per-phase prescriptions).
// Each block has: id, type, name, prescriptions: { phase: { load_kg, sets, reps, ... } }.
// Phases: 1 (Base, wks 1-6), 2 (Strength, wks 7-14), 3 (Power, wks 15-20), 4 (Taper, wks 21-22).

export const SESSIONS = {
  monday_am: {
    name: "Climbing Strength + Skills + Prehab",
    duration_min: 90,
    blocks: [
      {
        id: "front-lever",
        type: "bodyweight_time",
        name: "Front Lever progression",
        prescriptions: {
          1: { stage: "adv tuck", sets: 3, hold_seconds: 12 },
          2: { stage: "one-leg", sets: 3, hold_seconds: 12 },
          3: { stage: "straddle", sets: 3, hold_seconds: 10 },
          4: { stage: "straddle (maintain)", sets: 2, hold_seconds: 8 },
        },
      },
      {
        id: "oapu",
        type: "bodyweight_reps_per_side",
        name: "OAPU finger-drop",
        prescriptions: {
          1: { progression: "5-finger", sets: 3, reps_left: 3, reps_right: 3 },
          2: { progression: "4-finger", sets: 3, reps_left: 3, reps_right: 3 },
          3: { progression: "3-finger", sets: 3, reps_left: 3, reps_right: 3 },
          4: { progression: "3-finger (maintain)", sets: 2, reps_left: 3, reps_right: 3 },
        },
      },
      {
        id: "fingerboard-maxhangs",
        type: "weighted_time",
        name: "Fingerboard MaxHangs (20mm)",
        prescriptions: {
          1: { load_kg: 35, sets: 4, hold_seconds: 8 },
          2: { load_kg: 37.5, sets: 4, hold_seconds: 8 },
          3: { load_kg: 40, sets: 4, hold_seconds: 7 },
          4: { load_kg: 37.5, sets: 3, hold_seconds: 7 },
        },
      },
      {
        id: "pinch-block",
        type: "weighted_time_asymmetric",
        name: "Pinch Block",
        prescriptions: {
          1: { load_kg: 20, sets: 3, hold_s_left: 12, hold_s_right: 12 },
          2: { load_kg: 22, sets: 3, hold_s_left: 12, hold_s_right: 12 },
          3: { load_kg: 25, sets: 3, hold_s_left: 12, hold_s_right: 12 },
          4: { load_kg: 22, sets: 2, hold_s_left: 12, hold_s_right: 12 },
        },
      },
      {
        id: "weighted-pullups",
        type: "weighted_reps",
        name: "Weighted Pull-Ups",
        prescriptions: {
          1: { load_kg: 22.5, sets: 4, reps: 7 },
          2: { load_kg: 25, sets: 4, reps: 6 },
          3: { load_kg: 25, sets: 4, reps: 5 },
          4: { load_kg: 22.5, sets: 3, reps: 5 },
        },
      },
      {
        id: "shoulder-er-db",
        type: "shoulder_er",
        name: "Shoulder External Rotation (Side-lying Dumbbell)",
        prescriptions: {
          1: { position: 1, load_kg: 7, sets: 2, reps: 12 },
          2: { position: 1, load_kg: 9, sets: 2, reps: 12 },
          3: { position: 1, load_kg: 11, sets: 2, reps: 10 },
          4: { position: 1, load_kg: 10, sets: 2, reps: 8 },
        },
      },
      {
        id: "reverse-wrist-curls",
        type: "weighted_reps",
        name: "Reverse Wrist Curls",
        prescriptions: {
          1: { load_kg: 5, sets: 3, reps: 15 },
          2: { load_kg: 6, sets: 3, reps: 15 },
          3: { load_kg: 7.5, sets: 3, reps: 15 },
          4: { load_kg: 6, sets: 2, reps: 12 },
        },
      },
    ],
  },

  monday_pm: {
    name: "Z2 Run with GF (mandatory)",
    duration_min: 35,
    blocks: [
      {
        id: "z2-run",
        type: "running_z2",
        name: "Z2 run",
        prescriptions: {
          1: { duration_min: 30 },
          2: { duration_min: 35 },
          3: { duration_min: 40 },
          4: { duration_min: 25 },
        },
      },
    ],
  },

  tuesday: {
    name: "Lower Power + Nordics + Plyos",
    duration_min: 75,
    blocks: [
      {
        id: "nordic-curls",
        type: "tempo_eccentric",
        name: "Nordic Curls",
        prescriptions: {
          1: { variation: "ecc-only", sets: 3, reps: 5, eccentric_seconds: 5 },
          2: { variation: "assisted", sets: 3, reps: 6, eccentric_seconds: 5 },
          3: { variation: "full", sets: 3, reps: 5, eccentric_seconds: 4 },
          4: { variation: "full", sets: 2, reps: 4, eccentric_seconds: 3 },
        },
      },
      {
        id: "box-jumps",
        type: "plyo",
        name: "Box jumps",
        prescriptions: {
          1: { sets: 3, reps: 8 },
          2: { sets: 3, reps: 8, load_vest_kg: 5 },
          3: { sets: 3, reps: 6 },
          4: { sets: 2, reps: 5 },
        },
      },
      {
        id: "depth-jumps",
        type: "plyo",
        name: "Depth jumps",
        prescriptions: {
          1: { sets: 3, reps: 5 },
          2: { sets: 3, reps: 6 },
          3: { sets: 3, reps: 6 },
          4: { sets: 2, reps: 4 },
        },
      },
      {
        id: "single-leg-bounds",
        type: "bodyweight_reps_per_side",
        name: "Single-leg bounds",
        prescriptions: {
          1: { progression: "standard", sets: 3, reps_left: 6, reps_right: 6 },
          2: { progression: "standard", sets: 3, reps_left: 8, reps_right: 8 },
          3: { progression: "standard", sets: 3, reps_left: 8, reps_right: 8 },
          4: { progression: "standard", sets: 2, reps_left: 6, reps_right: 6 },
        },
      },
      {
        id: "bulgarian-split-squat",
        type: "weighted_reps",
        name: "Bulgarian Split Squats (per leg)",
        prescriptions: {
          1: { load_kg: 17.5, sets: 3, reps: 8 },
          2: { load_kg: 20, sets: 3, reps: 8 },
          3: { load_kg: 22.5, sets: 3, reps: 6 },
          4: { load_kg: 20, sets: 2, reps: 6 },
        },
      },
      {
        id: "copenhagen",
        type: "bodyweight_reps_per_side",
        name: "Copenhagen Hip Dips",
        prescriptions: {
          1: { progression: "dynamic", sets: 3, reps_left: 5, reps_right: 5 },
          2: { progression: "dynamic", sets: 3, reps_left: 8, reps_right: 8 },
          3: { progression: "dynamic", sets: 3, reps_left: 10, reps_right: 10 },
          4: { progression: "dynamic", sets: 2, reps_left: 6, reps_right: 6 },
        },
      },
      {
        id: "shoulder-er-db",
        type: "shoulder_er",
        name: "Shoulder External Rotation (Side-lying Dumbbell)",
        prescriptions: {
          1: { position: 1, load_kg: 7, sets: 2, reps: 12 },
          2: { position: 1, load_kg: 9, sets: 2, reps: 12 },
          3: { position: 1, load_kg: 11, sets: 2, reps: 10 },
          4: { position: 1, load_kg: 10, sets: 2, reps: 8 },
        },
      },
    ],
  },

  wednesday_am: {
    name: "Push Hypertrophy + Core + ER",
    duration_min: 55,
    blocks: [
      {
        id: "weighted-dips",
        type: "weighted_reps",
        name: "Weighted Dips",
        prescriptions: {
          1: { load_kg: 20, sets: 3, reps: 8 },
          2: { load_kg: 22.5, sets: 3, reps: 8 },
          3: { load_kg: 25, sets: 3, reps: 7 },
          4: { load_kg: 22.5, sets: 2, reps: 6 },
        },
      },
      {
        id: "db-ohp",
        type: "weighted_reps",
        name: "DB Overhead Press",
        prescriptions: {
          1: { load_kg: 20, sets: 4, reps: 7 },
          2: { load_kg: 22, sets: 4, reps: 7 },
          3: { load_kg: 22, sets: 4, reps: 8 },
          4: { load_kg: 20, sets: 3, reps: 6 },
        },
      },
      {
        id: "lateral-raises",
        type: "weighted_reps",
        name: "Lateral Raises",
        prescriptions: {
          1: { load_kg: 6, sets: 4, reps: 15 },
          2: { load_kg: 7.5, sets: 4, reps: 15 },
          3: { load_kg: 8, sets: 4, reps: 13 },
          4: { load_kg: 6, sets: 3, reps: 12 },
        },
      },
      {
        id: "explosive-pushups",
        type: "plyo",
        name: "Explosive push-ups",
        prescriptions: {
          1: { sets: 4, reps: 8 },
          2: { sets: 4, reps: 8 },
          3: { sets: 3, reps: 8 },
          4: { sets: 0, reps: 0 }, // skip during taper
        },
      },
      {
        id: "core-dragon-flag",
        type: "weighted_reps",
        name: "Dragon Flag",
        prescriptions: {
          1: { load_kg: 0, sets: 3, reps: 5 },
          2: { load_kg: 0, sets: 3, reps: 6 },
          3: { load_kg: 0, sets: 3, reps: 8 },
          4: { load_kg: 0, sets: 2, reps: 5 },
        },
      },
      {
        id: "core-t2b",
        type: "weighted_reps",
        name: "Toes-to-Bar",
        prescriptions: {
          1: { load_kg: 0, sets: 3, reps: 6 },
          2: { load_kg: 0, sets: 3, reps: 8 },
          3: { load_kg: 0, sets: 3, reps: 10 },
          4: { load_kg: 0, sets: 2, reps: 6 },
        },
      },
      {
        id: "shoulder-er-db",
        type: "shoulder_er",
        name: "Shoulder External Rotation (Side-lying Dumbbell)",
        prescriptions: {
          1: { position: 1, load_kg: 7, sets: 2, reps: 12 },
          2: { position: 1, load_kg: 9, sets: 2, reps: 12 },
          3: { position: 1, load_kg: 11, sets: 2, reps: 10 },
          4: { position: 1, load_kg: 10, sets: 2, reps: 8 },
        },
      },
    ],
  },

  wednesday_pm: {
    name: "ARC Climbing with friend (mandatory)",
    duration_min: 100,
    blocks: [
      {
        id: "arc-block",
        type: "climbing_arc",
        name: "ARC session",
        prescriptions: {
          1: { duration_min: 20, grade_range: "6c-7a", effort_pct: 55, falls: 0 },
          2: { duration_min: 25, grade_range: "6c-7a", effort_pct: 55, falls: 0 },
          3: { duration_min: 25, grade_range: "6c-7a", effort_pct: 55, falls: 0 },
          4: { duration_min: 15, grade_range: "6c-7a", effort_pct: 50, falls: 0 },
        },
      },
    ],
  },

  thursday: {
    name: "Kilterboard P-E + Pull Accessories",
    duration_min: 90,
    blocks: [
      {
        id: "kilterboard-4x4",
        type: "climbing_kilterboard",
        name: "Kilterboard 4×4",
        prescriptions: {
          1: { angle_deg: 25, rest_min_between_blocks: 10, target: "3 blocks × 5 routes @ V3-V4" },
          2: { angle_deg: 30, rest_min_between_blocks: 10, target: "3 blocks × 6 routes @ V4-V5" },
          3: { angle_deg: 35, rest_min_between_blocks: 8, target: "4 blocks × 5 routes @ V5-V6" },
          4: { angle_deg: 25, rest_min_between_blocks: 10, target: "2 blocks × 4 routes @ V3-V4" },
        },
      },
      {
        id: "db-rows",
        type: "weighted_reps",
        name: "Heavy DB Rows",
        prescriptions: {
          1: { load_kg: 26, sets: 3, reps: 10 },
          2: { load_kg: 28, sets: 3, reps: 10 },
          3: { load_kg: 30, sets: 3, reps: 8 },
          4: { load_kg: 26, sets: 2, reps: 8 },
        },
      },
      {
        id: "pinch-block-balance",
        type: "weighted_time_asymmetric",
        name: "Pinch Block (balance sets)",
        prescriptions: {
          1: { load_kg: 20, sets: 3, hold_s_left: 12, hold_s_right: 12 },
          2: { load_kg: 22, sets: 3, hold_s_left: 14, hold_s_right: 14 },
          3: { load_kg: 25, sets: 3, hold_s_left: 16, hold_s_right: 16 },
          4: { load_kg: 22, sets: 2, hold_s_left: 12, hold_s_right: 12 },
        },
      },
      {
        id: "shoulder-er-db",
        type: "shoulder_er",
        name: "Shoulder External Rotation (Side-lying Dumbbell)",
        prescriptions: {
          1: { position: 1, load_kg: 7, sets: 2, reps: 12 },
          2: { position: 1, load_kg: 9, sets: 2, reps: 12 },
          3: { position: 1, load_kg: 11, sets: 2, reps: 10 },
          4: { position: 1, load_kg: 10, sets: 2, reps: 8 },
        },
      },
    ],
  },

  saturday: {
    name: "Hard Sport Climbing (Project)",
    duration_min: 200,
    blocks: [
      {
        id: "project-session",
        type: "climbing_project",
        name: "Projecting",
        prescriptions: {
          1: { session_duration_min: 180 },
          2: { session_duration_min: 200 },
          3: { session_duration_min: 220 },
          4: { session_duration_min: 150 },
        },
      },
    ],
  },

  // Standalone session, not bound to a day-of-week. Available via the picker
  // whenever you want to log a Hyrox maintenance workout.
  hyrox: {
    name: "Hyrox Maintenance",
    duration_min: 25,
    blocks: [
      {
        id: "hyrox-maintenance",
        type: "running_hyrox",
        name: "Hyrox maintenance",
        prescriptions: {
          1: { format: "A" },
          2: { format: "A" },
          3: { format: "B" },
          4: { format: "A" },
        },
      },
    ],
  },
};

// Day-of-week (0=Sun..6=Sat) → array of session keys for that day.
// Some days have both AM and PM (Mon, Wed).
const DAY_OF_WEEK_TO_SESSIONS = {
  0: [],
  1: ["monday_am", "monday_pm"],
  2: ["tuesday"],
  3: ["wednesday_am", "wednesday_pm"],
  4: ["thursday"],
  5: [],
  6: ["saturday"],
};

export function programDayInfo(date = new Date(), startDateIso = config.programStartDate) {
  const start = new Date(startDateIso + "T00:00:00");
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.floor((today - start) / MS_PER_DAY); // 0-based
  const week = Math.floor(dayIndex / 7) + 1; // 1-based
  const phase = week <= 6 ? 1 : week <= 14 ? 2 : week <= 20 ? 3 : 4;
  const dayOfWeek = today.getDay();
  const sessionKeys = DAY_OF_WEEK_TO_SESSIONS[dayOfWeek];
  return { dayIndex, week, phase, dayOfWeek, sessionKeys };
}

export function getSession(key) {
  if (!(key in SESSIONS)) throw new Error(`Unknown session key: ${key}`);
  return SESSIONS[key];
}

export function prescribedForBlock(block, phase) {
  return block.prescriptions[phase] || {};
}

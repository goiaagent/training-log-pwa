import { describe, it, expect } from "vitest";
import { mergeRemoteIntoLocal } from "../js/remote.js";

function log(adjustments, sessions) {
  return `# Log

## Active Adjustments

${adjustments}

## Watchlist

## Sessions

${sessions}

## Daily Reviews

## Weekly Reviews
`;
}

const SESSION_A_LOCAL = `### 2026-06-10 — Wed — ARC
**Phase:** 1 · **Week:** 3

**Block A — ARC session** _(climbing_arc)_
- duration_min: 20 (edited locally)`;

const SESSION_A_REMOTE = `### 2026-06-10 — Wed — ARC
**Phase:** 1 · **Week:** 3

**Block A — ARC session** _(climbing_arc)_
- duration_min: 20`;

const SESSION_B = `### 2026-06-08 — Mon — Climbing Strength
**Phase:** 1 · **Week:** 3

**Block A — Front Lever** _(bodyweight_time)_
- Set 1: hold_seconds: 12`;

describe("mergeRemoteIntoLocal", () => {
  it("takes adjustments from remote, not local", () => {
    const merged = mergeRemoteIntoLocal(log("- **stale.local** — 1", ""), log("- **fresh.remote** — 2", ""));
    expect(merged).toContain("fresh.remote");
    expect(merged).not.toContain("stale.local");
  });

  it("unions sessions: remote-only sessions survive an empty local (device wipe)", () => {
    const merged = mergeRemoteIntoLocal(log("", ""), log("", SESSION_B));
    expect(merged).toContain("### 2026-06-08 — Mon — Climbing Strength");
  });

  it("unions sessions from both sides, newest first", () => {
    const merged = mergeRemoteIntoLocal(log("", SESSION_A_LOCAL), log("", SESSION_B));
    const a = merged.indexOf("### 2026-06-10");
    const b = merged.indexOf("### 2026-06-08");
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(-1);
    expect(a).toBeLessThan(b);
  });

  it("local version wins when both sides have the same session", () => {
    const merged = mergeRemoteIntoLocal(log("", SESSION_A_LOCAL), log("", `${SESSION_A_REMOTE}\n\n${SESSION_B}`));
    expect(merged).toContain("(edited locally)");
    expect(merged).toContain("### 2026-06-08 — Mon — Climbing Strength");
    // No duplicate of session A
    expect(merged.match(/### 2026-06-10 — Wed — ARC/g)).toHaveLength(1);
  });
});

# Hybrid Athlete Training Log

**Program start:** 2026-05-25
**Last updated:** 2026-06-10 (Day 7 review — ARC + history restore)

## Active Adjustments

_(none — the 2026-06-10 program rebase absorbed all prior adjustments into the Phase 1 baseline: fingerboard 32.5kg, OHP 17.5kg, OAPU asymmetric progression are now the program itself.)_

## Watchlist

- **arc-protocol drift** — Day 7 ARC ran at 80% effort with 3 falls and "push to failure" vs prescribed 55% / 0 falls. ARC trains the aerobic base only when it's continuous easy climbing; at 80% it becomes power-endurance and steals recovery from Thu kilter. Next ARC: drop to routes you can climb without falling, stay on the wall, target ~55%.
- **pre-session form on PM sessions** — ARC logged with sleep/mood/soreness zeros. AM sessions get real values; PM sessions don't. Acceptable (sleep was already logged that morning) but mood pre-climb is useful — fill if convenient.
- **lateral-raises 6kg test** — next push: program is 6kg now. If below 4×15 or RPE 9+, back off.
- **weighted-dips degradation** — 8/8/5 (Day 3) → 8/7/5 (Day 6). Hold 20kg one more push; if it degrades again, deload to 17.5kg or cut to 2 sets.
- **db-ohp recovery** — Day 6 failed 4×7 @ 17.5 (7/6/5/4 RPE 9). Program now prescribes 17.5; if next push fails again → deload to 15kg.
- **back-to-back upper-body fatigue** — Tue/Wed pair both at RPE 9 on upper movements. Watch next pair.
- **toes-to-bar regression** — 6/6/5 → 6/6/4. Hold 3×6.
- **sleep + mood trajectory** — 6h/6h/6h/6h/8h across logged AM sessions; mood 3/2/3/2/3. One 8h night so far.
- **front-lever progression** — 12/12/10 → 12/12/11. If next climbing day lands 12/12/12, test one-leg.
- **bulgarian-split-squat** — 17.5kg 3×8 RPE 9. Hold.
- **copenhagen-hip-dips** — "getting easy," soft bump candidate (P2 is 3×8+8).
- **pinch-block headroom** — RPE 7 at 20kg. Bump candidate (P2 is 22kg).

## Sessions



## Daily Reviews

### 2026-06-10 — Wed Wk 3 — review of Day 7 (ARC) + history restore
**Summary:** First climbing-volume session logged — the data the program actually exists for. 20min @ 6b+-6c+, but at 80% effort with 3 falls and "push to failure": that's a power-endurance session wearing an ARC costume. Prescribed ARC is ~55% effort, 0 falls, continuous movement — the adaptation (capillarization, recovery-while-climbing) only happens below the pump threshold. Next ARC: pick terrain you can't fall off, stay on the wall the full block.

**Adjustments:** All three remaining adjustments (fingerboard 32.5, OHP 17.5, OAPU asymmetric) expired — the program rebase made them the Phase 1 baseline. Active list is empty for the first time; the program now equals reality.

**Ops note:** GitHub-direct sync worked (this session arrived via PWA push, no upload). The sync also exposed a merge flaw — clearing site data wiped the phone's local history and the old "local owns Sessions" rule propagated the wipe to GitHub. Fixed: sessions now merge as a union (deduped by header), so neither side can erase history. Full session history restored from the Drive backup.

### 2026-06-10 — Wed Wk 3 — review of Day 5+6 (Tue Lower + Wed Push)

**Day 5 (Tue Lower):** Clean execution across the board. Nordic curls, box jumps, depth jumps, single-leg bounds, ER all hit prescription. Bulgarian RPE 9 at top of envelope (hold). Copenhagen "getting easy" — soft bump candidate. Sleep 6h, mood 2/5. **Notable: ER done at G position on lower-body day** — confirms the skip pattern is climbing-day-specific, not generic.

**Day 6 (Wed Push):** Mixed signal. Two real concerns:
- **DB OHP** at adjusted 17.5kg posted 7/6/5/4 RPE 9 — only set 1 hit the prescribed 7 reps, then tail-off. Adjustment did not clean. User notes "maybe I'm weaker now."
- **Weighted Dips** continued degrading: 8/8/5 (Day 3) → 8/7/5 (Day 6). Set 2 now falling too.

Bright spots:
- **Sleep 8h** (first time off 6h) + mood 3.
- **Explosive push-ups Set 1 = 8 reps** (was 5 on Day 3) — Set 1 capacity grew, decay pattern persists (8/6/3/1).
- **Lateral Raises** clean 4×15 @ 5kg RPE 8 — user confirms 6kg available now.
- **Dragon Flag, Shoulder ER** clean, on plan.

**Concerning pattern:** Tue Bulgarian RPE 9 + Wed Dips/OHP RPE 9 = back-to-back upper-body load. Likely contributing to OHP "weaker" read. Watch next Tue/Wed pair.

**Calibration:**
- Lateral raises: EXPIRE adjustment. Restore program 6kg next push.
- DB OHP: hold 17.5kg, restate auto-expire. If Day 8 also fails 4×7 → deload to 15kg.
- Weighted Dips: hold 20kg one more push, watchlist for cut/deload if degradation continues.
- Toes-to-Bar: hold (mild regression noted).
- All other Day 5+6 blocks on plan.

**Schema change shipped (v15):** Added `clapping_reps` optional column to plyo set_table. Next explosive push-ups can log total reps + clapping subset separately. Box/depth jumps unaffected (optional column).

### 2026-06-09 — Tue Wk 3 — review of Day 4 (Mon 2026-06-08, Climbing Strength)
**Summary:** Strongest session yet. Two adjustments earned auto-expire (fingerboard 30kg clean, pull-ups 3×7 clean). Front Lever trending up. ER + wrist curls skipped (3-of-3 climbing days).

**Calibration:** Fingerboard 30 → 32.5. OAPU sync to asymmetric. Pull-ups: restore 4 sets. **Structural:** ER + wrist curls moved to TOP of climbing sessions.

### 2026-06-04 — Thu Wk 2 — review of Day 3 (Push)
**Summary:** Real values logged. DB OHP 20kg too heavy (self-deload to 17.5). Dips set 3 collapse.

**Calibration:** DB OHP deload to 17.5. Lateral raises lock 5kg.

### 2026-06-04 — Thu Wk 2 — review of Day 2 (Climbing Strength)
**Summary:** Fingerboard 35 failed. Pull-ups tailed.

**Calibration:** Fingerboard 35→30. Pull-ups 4→3.

### 2026-05-28 — Thu Wk 1 — Kilterboard P-E + Pull Accessories
**Summary:** Kilter 5/4/4 attributed to sleep. ER skipped.

**Calibration:** Hold program.

## Weekly Reviews

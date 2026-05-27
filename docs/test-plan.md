# Manual Test Plan (one-time, after deploy)

After deploying to GitHub Pages and installing on phone, run through this
checklist once to verify the full loop.

## Setup verification

- [ ] PWA installs to home screen (iOS Safari: Share → Add to Home Screen)
- [ ] Sign in with Google succeeds, Drive scope granted
- [ ] First open creates an empty `log.md` in the configured folder (or finds existing)
- [ ] Today view shows today's day of week, phase, week correctly

## Logging a session

- [ ] Today view shows the program's prescribed loads for current phase
- [ ] Banner shows any active adjustments (initially empty — fine)
- [ ] Each block expands when tapped
- [ ] Per-type fields render correctly (e.g., pinch block shows L + R; running Z2 shows minutes only)
- [ ] RPE buttons select correctly, persist visually
- [ ] Tapping "Mark skipped" disables fields and changes button label
- [ ] Save button validates: missing required fields → error
- [ ] Save with valid data: log.md updated in Drive; "✓ Saved · HH:MM" shown
- [ ] Refresh PWA: new session appears in Log tab

## Editing recent session

- [ ] Log tab: latest session shows "edit" link
- [ ] Tap edit → form pre-populated with saved values
- [ ] Modify a value, save → log.md updated; entry has `_(edited <ts>)_` marker
- [ ] Older sessions do NOT show edit link

## Adjustments flow (manual Claude side)

- [ ] In Claude project: send "review today"
- [ ] Claude reads log.md, replies with proposal template
- [ ] Confirm with `y`
- [ ] Claude writes back: `## Active Adjustments` updated, `## Daily Reviews` appended
- [ ] Refresh PWA: Today view's prescribed loads reflect the new adjustment
- [ ] Adjust tab shows the adjustment with date set + expire

## Scheduled task (after schedule set up)

- [ ] Schedule fires at 22:00 (verify in Claude project the next morning)
- [ ] Proposal appears in chat without user prompt
- [ ] User confirmation still required to apply

## Offline behavior

- [ ] Airplane mode: PWA still opens (service worker)
- [ ] Tapping Save while offline: entry queued (badge or message indicating pending)
- [ ] Back online + reopen: queued entry syncs to Drive (this is best-effort in v1; if it doesn't sync, manual save after reconnect is acceptable)

## Conflict handling

- [ ] Set up: edit log.md directly in Drive editor (e.g., add a space), then save a new session from PWA before refreshing
- [ ] Save should detect ETag mismatch, retry, succeed
- [ ] No data loss

## Phone responsiveness

- [ ] All text is readable without zoom on iPhone-sized viewport
- [ ] All inputs are tappable with thumb (no 8px tap targets)
- [ ] Bottom tab nav doesn't overlap content
- [ ] Safe-area insets respected on phones with notches

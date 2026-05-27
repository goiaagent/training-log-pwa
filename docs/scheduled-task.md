# Scheduled Task — Daily & Weekly Reviews

The Claude Project includes two scheduled tasks that fire automatically:
- Daily at 22:00 local time → runs `review today`.
- Sundays at 22:00 local time → runs `weekly review`.

The scheduled run produces the proposal in the chat exactly like a manual run.
It does NOT auto-apply adjustments — you still confirm with `y`.

## Setting up the schedule in Claude

1. Open the project "Hybrid Athlete Training" in Claude.ai.
2. In the project sidebar, find **Scheduled tasks** (or the `/schedule` command).
3. Create a new schedule:
   - **Name**: Daily training review
   - **Cron**: `0 22 * * *` (22:00 every day)
   - **Prompt**: `review today`
   - **Timezone**: your local timezone
4. Create a second schedule:
   - **Name**: Weekly training review
   - **Cron**: `0 22 * * 0` (22:00 every Sunday)
   - **Prompt**: `weekly review`
   - **Timezone**: your local timezone

## When you'd disable a schedule

- Travel / vacation week: pause the schedule from the Claude Project settings.
- Injury time off: pause both schedules until you resume.

## When you miss a confirmation

If you don't confirm `y` before bed, the proposal sits in the chat. Open the
project the next time you have a moment, scroll to the latest proposal, and
respond `y` or edit. Adjustments won't activate until you confirm. The
**next** day's scheduled review will produce a fresh proposal that supersedes
the un-confirmed one.

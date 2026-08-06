# CreatorOS — Calendar Bound-Project Integration Test Plan

**Purpose:** produce the **bound-project integration test evidence** required before Milestone 3 approval.
The Calendar logic is already executed green via the Node CalendarApp mock (`CalendarTests`, 10/10); this plan
verifies the same behavior against the **real Google Calendar** on a bound Apps Script project — the one thing
the mock cannot prove. Run it once on a bound project and paste the results into §Results below.

> Honesty note: this environment has no Google session, so the assistant cannot execute these steps. The
> Product Owner (or QA) runs them on a bound project. Milestone 3 approval is contingent on this evidence.

## Preconditions

1. `clasp push` the M3 build to a bound Sheet (`appsscript.json` now includes the calendar scope).
2. **CreatorOS ▸ Initialize / Repair Workbook**, then complete Setup and approve a weekly plan that contains
   at least a few tasks with `Scheduled_Start/End` (use **Build Weekly Plan** → **Auto-allocate**/approve).
3. **CreatorOS ▸ Connect Calendar** → enter a **dedicated test calendar id** (recommended, so events are
   isolated). Grant the calendar authorization when prompted (this is where the calendar scope is requested).
4. Have 5+ eligible tasks (open, scheduled, in the approved week).

## Test cases (mirror the mock suite `CAL-001…010`)

| ID | Steps | Expected |
|---|---|---|
| INT-CAL-001 | Connect a valid calendar; then a bogus id | Valid → "Connected"; bogus → `CALENDAR_NOT_FOUND` message |
| INT-CAL-002 | **Push to Calendar** with 5 eligible tasks | 5 unique events created; each task shows a `Calendar_Event_ID` and `Synced` (AT-004) |
| INT-CAL-003 | **Push to Calendar** again | 0 created, 5 updated; **no duplicate events** on the calendar (AT-005) |
| INT-CAL-004 | Change a task's `Scheduled_Start`; **Sync Calendar** | The event's time moves to match (AT-006) |
| INT-CAL-005 | Delete one event **in Google Calendar directly**; **Sync Calendar** | That task → `Missing`; event **not** silently recreated |
| INT-CAL-006 | **Recreate Missing Events** | A fresh event is created; task → `Synced`, new event id |
| INT-CAL-007 | Push a batch where one task has no `Scheduled_Start` | Partial success reported; the bad task listed, others succeed (AT-010) |
| INT-CAL-008 | On a synced task, use the delete-linked-event path (menu/confirm) | Event removed; `Calendar_Event_ID` cleared; task → `Not Synced` |
| INT-CAL-009 | Push a task whose week is **not** approved | Reported ineligible (`PLAN_NOT_APPROVED`); no event |
| INT-CAL-010 | Add a **guest** to a synced event in Google Calendar; change the task name; **Sync Calendar** | Title updates; **the guest remains** (managed fields only, O-1) |
| INT-CAL-011 | Confirm the description contains `Task ID:` and a workbook link; title is `[CreatorOS] …` | Event content matches the contract §2 |
| INT-CAL-012 | **CreatorOS ▸ Run Tests** on the bound project | All suites green incl. Calendar (real Sheets + real Calendar via mock-free TestRunner cases that don't require external state) |

## Evidence to capture

For each case: pass/fail, a screenshot of the event(s)/task rows, and any error text. Also confirm quota
sanity (a 5–20 task batch completes within Apps Script limits) and that no unrelated calendar events were
touched.

## Results (paste after running)

| Case | Result | Evidence (screenshot/link) | Notes |
|---|---|---|---|
| INT-CAL-001 | | | |
| INT-CAL-002 | | | |
| INT-CAL-003 | | | |
| INT-CAL-004 | | | |
| INT-CAL-005 | | | |
| INT-CAL-006 | | | |
| INT-CAL-007 | | | |
| INT-CAL-008 | | | |
| INT-CAL-009 | | | |
| INT-CAL-010 | | | |
| INT-CAL-011 | | | |
| INT-CAL-012 | | | |

**Sign-off:** Milestone 3 is approved once INT-CAL-001…012 pass (or any failures are triaged and resolved),
in addition to the already-green mock suite (85/85).

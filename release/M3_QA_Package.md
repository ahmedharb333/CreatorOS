# CreatorOS — Milestone 3 QA Package

**Milestone 3 — Calendar Integration** · Product 1.0.0 · Schema 1 · 2026-08-07
For Product QA. Built to the approved Calendar Event Contract (O-1…O-4). Work **stops here**; Recovery (M4)
not started.

> **Approval condition:** mock suite is green (85/85), **and** the bound-project integration evidence
> (`docs/Calendar_Integration_Test_Plan.md`, INT-CAL-001…012 on a real Google Calendar) must be captured
> before Milestone 3 is signed off. The build environment has no Google session, so that run is done by
> QA/Product Owner.

## 1. Completed features

`CalendarService`: `testConnection`, `pushTasks`, `syncTasks`, `deleteLinkedEvent`, `recreateMissingEvent`.
Task-as-source-of-truth (manages title/start/end/description only — never attendees/conferencing/attachments,
O-1). Idempotent via `Task ID` marker + `Calendar_Event_ID`; ±1 day duplicate window (O-2); explicit actions
only (O-4); task work blocks only (O-3); per-record partial-failure reporting; narrow queries; approved-week
gating. Menu: Connect Calendar, Push to Calendar, Sync Calendar, Recreate Missing Events.

## 2. Remaining work (later milestones — not started, by instruction)

Bound-project integration evidence (I-06) · M4 Recovery/Repurposing/Performance/Dashboard · M5 AI/Notifications
(opt-in auto-sync trigger) · M6 Release · UI dialogs · optional publishing-milestone events (deferred, O-3).

## 3. Test results

- **85 / 85 executed green** — pure-logic **34/34** + GAS suites via mock **51/51** (Schema 7, IdService 5,
  Validation 6, Repository 6, Domain 12, Planning 5, **Calendar 10**). Static analysis **36/36** `node --check`.
- Calendar coverage: connection, idempotent push, no-duplicates, sync update, missing-detection, recreate,
  delete, partial-failure, unapproved-week gating, O-1 attendee preservation.
- **Bound-project (real Calendar) evidence pending** — `docs/Calendar_Integration_Test_Plan.md`.

## 4. Known issues

0 Critical / High / Medium, 4 Low (**I-06** bound-project Calendar evidence required; I-03 placeholder scriptId;
I-04 doc reconciliation; I-01 on-Google run for M1/M2 suites). See `docs/KNOWN_ISSUES.md`.

## 5. Assumptions & deviations

- **ADR-018** (calendar sync design). **DEVIATIONS D-05** (calendar scope declared in manifest; UX-staged).
- Contract `docs/Calendar_Event_Contract.md` approved with O-1…O-4; roadmap D-ROADMAP-1 (Basic/Pro/Team, no
  Free tier); no tier gating/billing implemented.

## 6. Folder structure & source files

`src/services/` now includes `CalendarService.js` (8 services total). `tests/` includes 8 GAS suites +
`node/` harness (with a `CalendarApp` mock). Full tree in `README.md`.

## 7. Workbook artifact

Generated at runtime by **Initialize / Repair Workbook**; see `release/WORKBOOK_ARTIFACT.md`.

## 8. Installation notes

1. New Google Sheet → Apps Script → Script ID into `.clasp.json`; `clasp push` (manifest now includes the
   calendar scope — authorization is requested when you use **Connect Calendar**).
2. Initialize / Repair → Complete Setup → add idea → convert → generate tasks → Build Weekly Plan → approve →
   auto-allocate → **Connect Calendar** → **Push to Calendar**.
3. Run `docs/Calendar_Integration_Test_Plan.md` and paste results.

## 9. Next-step recommendations

1. Capture the bound-project Calendar evidence (closes I-06) → formal M3 sign-off.
2. On approval, authorize **Milestone 4 — Recovery & Analytics** (overdue recovery actions that also update
   linked calendar events, repurposing, performance entry, dashboard).

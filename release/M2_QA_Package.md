# CreatorOS — Milestone 2 QA Package

**Milestone 2 — Core Domain** · Product 1.0.0 · Schema 1 · 2026-08-07
Prepared for Product QA sign-off. Work **stops here** pending approval; Calendar (M3) not started.

---

## 1. Completed features

- **Setup** (FR-001): sheet-driven validate/save/complete/rerun; CONFIG mirroring; records preserved.
- **Ideas** (FR-003): capture/score/convert/archive; conversion derives Objective (from Strategic Goal) and
  Priority (from Priority_Score), requiring confirmation when underivable — no arbitrary defaults.
- **Content** (FR-004): create/update/selectWorkflow/changeStatus/markPublished; controlled pause/resume.
- **Workflow** (FR-004): find/getSteps/validate/clone.
- **Tasks** (FR-005): generate (3 modes), backward due dates, authoritative `Dependency_Task_IDs` graph,
  closed-task immutability, complete/block/detectOverdue.
- **Capacity** (FR-006): utilization + warning levels.
- **Weekly plan** (FR-007): build/approve + `autoAllocate` work-day scheduling.
- **Today** (FR-008): priority-ordered sections + sheet render.
- Menu: Complete Setup, Reopen Setup, Build Weekly Plan, Open Today.

## 2. Remaining work (later milestones — not started, by instruction)

M3 Calendar · M4 Recovery/Repurposing/Performance/Dashboard · M5 AI · M6 Release/migration · UI dialogs/wizard.

## 3. Test results

- **75 / 75 executed green** — pure-logic **34/34** + GAS suites via mock **41/41** (Schema 7, IdService 5,
  Validation 6, Repository 6, **Domain 12**, **Planning 5**). Static analysis **34/34** `node --check`.
- Full detail: [`docs/TEST_RESULTS.md`](../docs/TEST_RESULTS.md); raw output `tests/gas_mock_output.txt`,
  `tests/pure_test_output.txt`.
- On-Google run recommended as final confirmation (I-01).

## 4. Known issues

0 Critical, 0 High, 0 Medium, 3 Low (I-01 on-Google confirmation, I-03 placeholder scriptId, I-04 doc
reconciliation). See [`docs/KNOWN_ISSUES.md`](../docs/KNOWN_ISSUES.md).

## 5. Assumptions & deviations

- New ADRs: **014** (sheet-driven setup), **015** (due-dates-only generation + planner scheduling),
  **016** (pause/resume), **017** (authoritative dependency graph). See `docs/ARCHITECTURE_DECISION_RECORDS.md`.
- Deviation **D-04**: added `TASKS.Dependency_Task_IDs` (JSON) and `CONTENT.Paused_From_Status` — additive,
  column-order-safe, schema stays v1 (un-deployed, no migration). See `docs/DEVIATIONS.md`.

## 6. Folder structure & source files

`src/` now includes `services/*` (7) + `repositories/*` (9). `tests/` includes 7 GAS suites + `node/` harness.
Full tree in `README.md`.

## 7. Workbook artifact

Generated at runtime by **Initialize / Repair Workbook** after `clasp push` (bound Apps Script product; no
static `.xlsx`). See `release/WORKBOOK_ARTIFACT.md`.

## 8. Installation notes

1. New Google Sheet → Apps Script → copy Script ID into `.clasp.json`; `clasp push`.
2. **CreatorOS ▸ Initialize / Repair Workbook** → **Verify Schema** → **Run Tests**; paste output into `docs/TEST_RESULTS.md §5`.
3. Try the M2 flow: fill SETUP → **Complete Setup**; add an idea → convert → generate tasks → **Build Weekly Plan** → **Open Today**.
4. Only spreadsheet + UI scopes are requested at this milestone.

## 9. Next-step recommendations

1. Approve/amend the M2 registers (esp. ADR-016/017, D-04).
2. Run the suite on a bound project to close I-01.
3. On approval, authorize **Milestone 3 — Calendar** (connection, event creation, idempotent sync,
   duplicate prevention, missing-event recovery). Push-eligibility builds on the approved weekly plan +
   allocated `Scheduled_Start/End`.

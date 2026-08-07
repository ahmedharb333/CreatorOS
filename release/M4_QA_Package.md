# CreatorOS — Milestone 4 QA Package

**Milestone 4 — Recovery & Analytics** · Product 1.0.0 · Schema 1 · 2026-08-07
For Product QA. Built to the approved plan (D4-1…D4-5) + ADR-019. Work **stops here**; AI/Notifications (M5)
not started.

## 1. Completed features

Recovery (scan/analyze/apply 7 actions, logged; Recover→Changed→Sync, no auto-cancel), rule-based Repurposing
(accept → linked content; no AI), menu-driven Performance entry (published-only; system-store PERFORMANCE),
AnalyticsService KPI layer + decision-oriented Dashboard with the flagship **Execution Score**, sheet
**visibility metadata** (creator|system) on every sheet, and a hidden **RECOVERY_LOG**. Menu: Run Recovery,
Suggest Repurposing, Record Performance, Refresh Dashboard.

## 2. Remaining work (later milestones — not started, by instruction)

M5 AI/Notifications (incl. opt-in auto-sync trigger) · M6 Release/migration · UI dialogs + Creator Mode /
Advanced Workspace hiding (metadata ready) · optional publishing-milestone calendar events.

## 3. Test results

- **100 / 100 executed green** — pure-logic **34/34** + GAS suites via mock **66/66** (Schema 8, IdService 5,
  Validation 6, Repository 6, Domain 12, Planning 5, Calendar 10, **Recovery 4, Repurposing 3, Performance 3,
  Analytics 2, Dashboard 2**). Static analysis **44/44** `node --check`.
- Full detail: `docs/TEST_RESULTS.md`; raw output `tests/gas_mock_output.txt`, `tests/pure_test_output.txt`.

## 4. Known issues

0 Critical/High/Medium; Low: **I-06** (M3 bound-project Calendar evidence, outstanding for M3 sign-off — M4
adds no new external API), I-03 placeholder scriptId, I-04 doc reconciliation, I-01 on-Google run.
See `docs/KNOWN_ISSUES.md`.

## 5. Assumptions & deviations

- **ADR-019** (Hide the Complexity: Creator Mode vs Advanced Workspace; visibility metadata).
- No new deviations in M4. Schema stays version 1 (RECOVERY_LOG added; `visibility` is code metadata, not a
  sheet column).

## 6. Folder structure & source files

`src/services/` = 13 services; `src/repositories/` = 10 repositories. `tests/` = 10 GAS suites + `node/` harness.
Full tree in `README.md`.

## 7. Workbook artifact

Generated at runtime by **Initialize / Repair Workbook**; see `release/WORKBOOK_ARTIFACT.md`. Now 17 tabs
(added RECOVERY_LOG, a system sheet).

## 8. Installation notes

1. Sheet → Apps Script → Script ID into `.clasp.json`; `clasp push`; Initialize / Repair.
2. Demo M4: complete setup → ideas → content → tasks → weekly plan → (recovery on overdue) → Suggest
   Repurposing → mark content Published → Record Performance → **Refresh Dashboard** (see Execution Score).
3. Run **CreatorOS ▸ Run Tests** and paste output.

## 9. Next-step recommendations

1. On approval, authorize **Milestone 5 — AI & Notifications** (AiService consuming AnalyticsService + recovery
   log; email reminders; opt-in auto-sync trigger).
2. Close I-06 (bound-project Calendar evidence) to formally complete M3.

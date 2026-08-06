# 24 — Requirements Traceability Matrix

## Purpose

This document maps every major CreatorOS v1 requirement to its implementation area, validation method, and release evidence.

## Traceability rules

- Every requirement must have at least one implementation reference.
- Every functional requirement must have at least one test case.
- Every release claim must be supported by evidence.
- Unimplemented requirements must be explicitly marked `Deferred`, `Blocked`, or `Rejected`.
- No requirement may be silently omitted.

## Status values

- Not Started
- In Progress
- Implemented
- Tested
- Passed
- Failed
- Deferred
- Blocked

## Matrix

| Requirement ID | Requirement | Priority | Implementation Area | Primary Service | Test IDs | Evidence Required | Status |
|---|---|---:|---|---|---|---|---|
| FR-001 | Guided initial setup | Must | SETUP, Setup dialog | SetupService | AT-001, INST-001 | setup recording, test log | Not Started |
| FR-002 | Immutable unique IDs | Must | all operational sheets | IdService | ID-001 to ID-004 | automated test log | Not Started |
| FR-003 | Idea capture and scoring | Must | IDEAS | IdeaService | IDEA-001 to IDEA-005 | sample records | Not Started |
| FR-004 | Content creation | Must | CONTENT | ContentService | CNT-001 to CNT-005 | sample records | Not Started |
| FR-005 | Task generation | Must | TASKS, WORKFLOWS | TaskService | TSK-001 to TSK-006 | workflow output | Not Started |
| FR-006 | Capacity calculation | Must | WEEKLY_PLAN | CapacityService | CAP-001 to CAP-004 | calculations | Not Started |
| FR-007 | Weekly planning | Must | WEEKLY_PLAN | PlanningService | PLN-001 to PLN-006 | approved plan | Not Started |
| FR-008 | Today view | Must | TODAY | PlanningService | TDY-001 to TDY-005 | screenshot and test | Not Started |
| FR-009 | Calendar connection | Must | SETUP | CalendarService | CAL-001 to CAL-003 | connection test | Not Started |
| FR-010 | Calendar event creation | Must | TASKS | CalendarService | CAL-004 to CAL-008 | event evidence | Not Started |
| FR-011 | Calendar updates | Must | TASKS | CalendarService | CAL-009 to CAL-012 | sync evidence | Not Started |
| FR-012 | Overdue detection | Must | TASKS, TODAY | RecoveryService | REC-001 to REC-003 | overdue sample | Not Started |
| FR-013 | Recovery workflow | Must | TODAY, dialog | RecoveryService | REC-004 to REC-010 | recovery log | Not Started |
| FR-014 | Repurposing | Should | REPURPOSING | RepurposingService | REP-001 to REP-006 | derivative sample | Not Started |
| FR-015 | Performance entry | Should | PERFORMANCE | PerformanceRepository | PERF-001 to PERF-004 | sample metrics | Not Started |
| FR-016 | Dashboard | Must | DASHBOARD | DashboardService | DASH-001 to DASH-008 | KPI evidence | Not Started |
| FR-017 | AI provider setup | Should | SETUP | AiService | AI-001 to AI-006 | provider tests | Not Started |
| FR-018 | AI request management | Should | AI_LOG | AiService | AI-007 to AI-013 | response log | Not Started |
| FR-019 | AI weekly suggestions | Should | dialog, WEEKLY_PLAN | AiService | AI-014 to AI-020 | reviewed plan | Not Started |
| FR-020 | Optional notifications | Could | triggers, email | NotificationService | NTF-001 to NTF-006 | received email | Not Started |
| NFR-001 | Performance within Apps Script limits | Must | all services | Engineering | PERF-NF-001 | timing results | Not Started |
| NFR-002 | Partial failure handling | Must | integrations | Engineering | REL-001 to REL-004 | failure report | Not Started |
| NFR-003 | Security controls | Must | properties, logs | Security | SEC-001 to SEC-008 | security test | Not Started |
| NFR-004 | Nontechnical usability | Must | UI | UI | UX-001 to UX-010 | tester results | Not Started |
| NFR-005 | Maintainable modular code | Must | source | Engineering | CODE-001 to CODE-006 | code review | Not Started |
| NFR-006 | Copy portability | Must | deployment | SetupService | INST-002 to INST-005 | clean-copy test | Not Started |
| NFR-007 | Localization readiness | Should | config | ConfigService | LOC-001 to LOC-004 | timezone test | Not Started |
| NFR-008 | Data integrity | Must | repositories | Engineering | DATA-001 to DATA-008 | integrity test | Not Started |

## Milestone sign-off

Each milestone must include:

- requirement coverage percentage;
- passed test percentage;
- unresolved critical defects;
- unresolved high defects;
- assumptions added;
- deviations added;
- release recommendation.

## Final release threshold

- 100% of Must requirements implemented and passed.
- At least 90% of Should requirements implemented or formally deferred.
- No critical defect.
- No high-severity defect without signed exception.
- Security tests passed.
- Copy-install test passed.

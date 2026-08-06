# CreatorOS — Recommendations Register

Improvements identified during implementation that **do not change the product vision or MVP scope**.
Per Product Owner instruction, these are **documented, not auto-implemented**. Each is ranked by
**Impact** (High/Medium/Low) and **Effort** (High/Medium/Low) with trade-offs. Await approval before
implementing any item.

| ID | Recommendation | Impact | Effort | Trade-off / Notes | Status |
|---|---|---|---|---|---|
| R-01 | **Single-source enums/schema → generate sheet validations from `Constants.gs`.** Keep every enum and header list in code as the one source of truth; `WorkbookService` builds all data validations from it (already the M1 approach). Extend this so a future doc-generator emits the schema tables from code, eliminating doc/code drift (the root cause of conflict C2). | Medium | Low | Slight up-front indirection; big long-term win on consistency. | Proposed |
| R-02 | **Schema-version guard on every write.** Have `BaseRepository` refuse writes when `SCHEMA_VERSION` in the workbook ≠ code's expected version (error `SCHEMA_VERSION_MISMATCH`), preventing a stale copy from corrupting data after an upgrade. | High | Low | One extra cached read per session; must be bypassable during the upgrade migration itself. | Proposed |
| R-03 | **Correlation ID on all bulk operations from day one.** Thread a `COR-` id through batch calendar/task/AI operations and stamp it into `SYSTEM_LOG.Correlation_ID` (column already exists). Makes partial-failure debugging tractable. | Medium | Low | Negligible cost; mostly plumbing. Partially in place via LoggerService. | Proposed |
| R-04 | **Lightweight header-hash cache in `BaseRepository`.** Cache each sheet's header map in `CacheService` keyed by a hash of row 1, invalidated on schema change, to avoid re-reading headers on every call within execution limits. | Medium | Medium | Cache-invalidation complexity; only pays off at higher record volumes. | Proposed |
| R-05 | **`sample-data` as a one-click loader, not static CSV.** Provide `loadSampleWorkspace()` that writes the doc-21 test dataset through the real repositories (so it exercises validation + IDs), rather than pasting static rows. Doubles as an integration smoke test. | Medium | Low | Sample data then depends on repositories being healthy — acceptable and arguably desirable. | Proposed |
| R-06 | **Make `CONTENT.Objective` end-user-editable at runtime** (like priority weights) by sourcing the list from CONFIG instead of a code enum. | Low | Medium | Trades validation integrity (a fixed enum) for flexibility; needs CONFIG wiring + validation to read the dynamic list. Defer until a creator actually needs custom objectives. | Proposed |

Add new recommendations here as they arise. Do not implement without Product Owner approval.

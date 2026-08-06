# CreatorOS — Changelog

All notable changes to this project. Format loosely follows Keep a Changelog. CreatorOS uses semantic
versioning with two tracked numbers: **PRODUCT_VERSION** (`MAJOR.MINOR.PATCH`) and **SCHEMA_VERSION** (integer).

## [Unreleased] — Milestone 1: Workbook & Repositories

- PRODUCT_VERSION `1.0.0`, SCHEMA_VERSION `1`.
- Repository scaffold: `/docs`, `/src` (+ `repositories`, `services`, `providers`, `ui`), `/tests`,
  `/sample-data`, `/release`, and governance files (`README`, `ASSUMPTIONS`, `DEVIATIONS`, `CHANGELOG`,
  `TEST_RESULTS`, `KNOWN_ISSUES`).
- clasp config (`appsscript.json`, `.clasp.json` placeholder), `.gitignore`.
- `Constants.gs`: sheet registry, ID prefix registry, enum catalog, schema/product version, named-range keys.
- `Errors.gs`: `AppError` + error catalog codes (docs 20).
- `LoggerService.gs`: structured INFO/WARN/ERROR/CRITICAL logging to `SYSTEM_LOG` with secret sanitization.
- `ConfigService.gs`: CONFIG sheet accessors, named ranges, Script/User Properties, version markers.
- `IdService.gs`: LockService-guarded, Script-Property-backed sequential immutable IDs; `next/reserve/validate`.
- `ValidationService.gs`: primitive + schema validators (enums, numeric ranges, dates, IDs).
- `WorkbookService.gs`: builds all 16 sheets with headers, data validations, protections, named ranges,
  formats; idempotent (safe re-run, preserves data).
- `BaseRepository.gs` + entity repositories (Idea, Content, Task, Workflow, Performance, Repurposing):
  header-mapped, batch read/write, immutable IDs.
- `WorkflowSeed.gs`: 8 default workflows (docs 27) loaded into WORKFLOWS.
- `Menu.gs` / `Main.gs`: `onOpen` menu, first-run initialization (schema verify, counters, workflows, version).
- `tests/`: GAS-native `TestRunner` + schema/ID/repository suites; menu entry `Run Tests`.
- Documentation register: resolved C1–C3, filled G1–G3, recorded D1–D3, E1–E2 (see `ASSUMPTIONS.md`).

### Milestone 1 — post-approval corrections (2026-08-06)

- **Tests executed** (correction 1): added Node Apps Script mock (`tests/node/mock_gas.js`) + runner; GAS
  suites now execute — **24/24 passed**; pure-logic **34/34**; `TEST_RESULTS.md` updated with actual results.
- **Folder READMEs** (correction 2): `src/services`, `src/providers`, `src/ui` responsibilities documented.
- **Goal vs Objective** (correction 3): `CONTENT.Objective` redefined to a distinct funnel-verb vocabulary
  (`Reach, Engage, Educate, Convert, Nurture, Monetize`); `docs/CONCEPTS_GOAL_VS_OBJECTIVE.md` added; G2 resolved.
- **Multi-dependency** (correction 4): workflow `Dependency_Sequence` → `Dependency_Sequences` (CSV);
  `parseDependencies()` added; YouTube long-form Final QA stores `"7,8"`; G3 resolved, D-03 recorded, ADR-011.
- **ADRs** (correction 5): `ARCHITECTURE_DECISION_RECORDS.md` added (ADR-001…013).
- `.claspignore` excludes `tests/node/**` (Node-only harness not pushed to Apps Script).

# CreatorOS

**Plan. Execute. Publish. Grow.**

An execution operating system for solo content creators, built on **Google Sheets + Google Apps Script**
with optional, **customer-funded** AI. CreatorOS turns a creator's goals and publishing commitments into
production tasks, calendar work blocks, missed-work recovery, and repurposing — and works fully without AI.

> Commercial product. Not a template. See the specification set in [`/docs`](docs/).

---

## Status

**Milestone 1 — Workbook & Repositories** (code-complete; see [`CHANGELOG.md`](CHANGELOG.md)).

- Product version **1.0.0** · Schema version **1**
- Milestones 2–6 (domain, calendar, recovery/analytics, AI, release) are **not** started, by instruction.

## Architecture (six layers, docs 15)

```
Presentation (Menu, dialogs)          src/Menu.js, src/ui/*        [ui in later milestones]
Application  (use-case coordination)  src/Main.js
Domain       (planning, capacity…)    src/services/*              [later milestones]
Repository   (sheet I/O, header maps) src/repositories/*
Integration  (Calendar, email, AI)    src/providers/*             [later milestones]
Infrastructure (config, ids, logs)    src/Constants|Config|Id|Logger|Validation|Errors.js
```

**Rule:** only the repository layer touches sheet cells. Business logic never reads cells directly.

## Repository layout

```
docs/            The 30-document specification set (source of truth)
src/             Apps Script source (pushed via clasp)
  repositories/  BaseRepository + entity repositories
  services/      domain services (later milestones)
  providers/     AI provider adapters (later milestones)
  ui/            dialogs/sidebars (later milestones)
tests/           GAS-native test runner + suites
sample-data/     sample workspace dataset
release/         milestone QA packages / release artifacts
ASSUMPTIONS.md   resolved conflicts, filled gaps, design decisions
DEVIATIONS.md    documented deviations from spec letter
RECOMMENDATIONS.md improvement proposals (ranked; await approval)
KNOWN_ISSUES.md  open limitations
CHANGELOG.md     version history
TEST_RESULTS.md  executed + pending test evidence
```

## What Milestone 1 delivers

- All **16 sheets** built from a single schema (`src/Constants.js`) with headers, data validations,
  protected ID/formula/log/config ranges, named ranges, frozen headers, and color rules.
- **Immutable IDs** (`IdService`) — LockService-guarded, Script-Property counters, `PREFIX-000000`, never reused.
- **Configuration layer** (`ConfigService`) — CONFIG sheet + named ranges, Script/User Properties, version markers.
- **Repository layer** — `BaseRepository` + Idea/Content/Task/Workflow/Performance/Repurposing/WeeklyPlan,
  header-mapped, batch read/write, formula-aware (`Priority_Score`).
- **Default workflow library** — 8 workflows (docs 27) loaded through the repository.
- **Validation, logging, typed errors** — per docs 26/20/29 (secrets sanitized before logging).
- **Tests** — pure-logic suite (executed in Node) + Spreadsheet-bound suites (run in GAS).

## Install / run (Product Owner)

1. Create a new Google Sheet; open **Extensions ▸ Apps Script**; copy its **Script ID**.
2. Put the Script ID in `.clasp.json` (`scriptId`).
3. From this repo: `clasp push` (never edit in the online editor except emergency hotfixes).
4. Reload the Sheet → **CreatorOS ▸ Initialize / Repair Workbook**.
5. **CreatorOS ▸ Run Tests** → confirm the summary, then paste the result block into `TEST_RESULTS.md`.

Milestone 1 requests only spreadsheet + UI scopes (`appsscript.json`). Calendar, external (AI), and email
scopes are added in the milestones that use them (staged authorization, docs 29 §3).

## AI policy

AI is optional and customer-funded. The customer supplies their own API key (stored in User Properties,
never in cells or logs). Core features work with AI disabled. No AI code ships in Milestone 1.

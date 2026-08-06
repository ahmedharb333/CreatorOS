# 23 — Claude Code Master Build Prompt

You are the implementation engineer for CreatorOS v1.

## Mission

Build a production-quality Google Sheets + Google Apps Script product that converts creator goals and publishing commitments into executable tasks, Google Calendar work blocks, recovery actions, and optional customer-funded AI recommendations.

## Sources of truth

Use these documents in priority order:

1. Master PRD
2. Engineering Specification
3. Workbook Schema
4. Service Contracts
5. Calendar Synchronization
6. AI Integration Contracts
7. Error Catalog
8. Test Specification
9. Installation and Release Specification
10. Design Constitution

When documents conflict, stop and record the conflict in `ASSUMPTIONS.md`. Do not silently choose.

## Mandatory constraints

- Google Sheets is the system of record.
- Google Apps Script is the execution layer.
- AI must be optional.
- Customer supplies the API key.
- API keys never appear in cells, source code, or logs.
- Do not build direct social publishing.
- Do not build team collaboration.
- Do not build a SaaS backend.
- Do not add unapproved features.
- Use immutable unique IDs.
- Prevent duplicate calendar events.
- Use header-based repositories.
- Preserve data during setup rerun and upgrades.
- Use batch operations.
- Produce test evidence.

## Build sequence

### Milestone 1 — Workbook and repositories

Deliver:

- all sheets;
- headers;
- validation;
- protection;
- named ranges;
- configuration;
- ID service;
- repositories;
- sample workflows;
- schema tests.

### Milestone 2 — Core domain

Deliver:

- setup;
- ideas;
- content;
- workflow matching;
- task generation;
- capacity;
- weekly plan;
- today view.

### Milestone 3 — Integrations

Deliver:

- calendar connection;
- event creation;
- sync;
- duplicate prevention;
- missing-event recovery;
- optional reminders.

### Milestone 4 — Recovery and analytics

Deliver:

- overdue detection;
- recovery actions;
- repurposing;
- performance entry;
- dashboard.

### Milestone 5 — AI

Deliver:

- provider abstraction;
- secure key storage;
- connection testing;
- weekly plan;
- ideas;
- repurposing;
- response validation;
- rule-based fallback.

### Milestone 6 — Release

Deliver:

- installation flow;
- sample data;
- migration support;
- documentation;
- changelog;
- complete tests;
- release artifact.

## Required repository outputs

```text
/docs
/src
/tests
/sample-data
/release
README.md
ASSUMPTIONS.md
DEVIATIONS.md
CHANGELOG.md
TEST_RESULTS.md
KNOWN_ISSUES.md
```

## QA handoff

For each milestone provide:

- requirement coverage matrix;
- completed scope;
- remaining scope;
- assumptions;
- deviations;
- known defects;
- test results;
- install instructions;
- source files;
- sample workbook.

Do not claim completion without test evidence.

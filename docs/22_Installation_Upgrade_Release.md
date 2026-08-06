# 22 — Installation, Upgrade, and Release

## 1. Customer delivery package

The paid package must contain:

- CreatorOS workbook;
- Apps Script project;
- setup guide;
- authorization guide;
- calendar guide;
- AI provider guide;
- troubleshooting guide;
- changelog;
- license terms;
- sample workspace.

## 2. First-run initialization

On first run:

1. verify workbook schema;
2. create missing noncritical named ranges;
3. initialize counters;
4. create default workflows;
5. set product version;
6. open setup wizard;
7. avoid creating triggers without consent.

## 3. Authorization flow

Request scopes only when features require them.

Suggested staged authorization:

- Spreadsheet: first use
- Calendar: when calendar connection is enabled
- External requests: when AI is enabled
- Email: when reminders are enabled

## 4. Copy behavior

Customer copy must:

- retain formulas and protections;
- retain Apps Script;
- initialize user-specific settings;
- not retain seller or previous customer secrets;
- not retain previous calendar IDs;
- not retain previous AI keys.

## 5. Versioning

Use semantic versioning:

```text
MAJOR.MINOR.PATCH
```

- major: incompatible schema or behavior;
- minor: backward-compatible feature;
- patch: defect fix.

Track both:

- PRODUCT_VERSION
- SCHEMA_VERSION

## 6. Upgrade strategy

An upgrade script must:

1. inspect current schema version;
2. back up affected sheets;
3. apply migrations in order;
4. preserve user records;
5. log changes;
6. report completion or rollback guidance.

## 7. Backup

Before migration:

- create timestamped workbook copy or sheet backups;
- record backup reference;
- do not proceed if backup fails for destructive migrations.

## 8. Release gates

### Alpha

- internal workflow works;
- no data-loss defect;
- schema stable enough for testers.

### Beta

- five external testers;
- installation validated;
- calendar duplication prevented;
- major usability problems addressed.

### Paid release

- documentation complete;
- support policy defined;
- permissions disclosed;
- test evidence delivered;
- no critical or high-severity issue.

## 9. Rollback

For failed migration:

- stop additional writes;
- retain logs;
- restore affected sheet from backup;
- restore version markers;
- show user recovery instructions.

## 10. Support boundaries

Support covers:

- installation;
- documented features;
- reproducible defects;
- supported AI providers;
- Google platform compatibility.

Support excludes:

- social-platform account issues;
- custom workflow development unless sold separately;
- third-party API charges;
- AI output quality guarantees;
- customer-modified scripts outside documented extension points.

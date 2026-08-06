# 15 — Engineering Overview

## 1. Purpose

This specification defines how CreatorOS v1 must be implemented as a Google Sheets and Google Apps Script product.

It converts the approved product requirements into:

- workbook structure;
- data contracts;
- service interfaces;
- workflow logic;
- calendar integration behavior;
- AI provider behavior;
- validation rules;
- error handling;
- testing requirements;
- deployment and upgrade procedures.

Claude Code must treat this package as the implementation authority together with the Master PRD.

## 2. Technical baseline

### Runtime

- Google Sheets
- Google Apps Script V8 runtime
- Google Calendar service
- Gmail or MailApp for optional notifications
- UrlFetchApp for optional AI calls
- PropertiesService for configuration and secrets
- LockService for collision-sensitive operations
- CacheService for short-lived noncritical caching

### Supported user model

- one Google account;
- one CreatorOS workbook;
- one creator brand;
- one primary calendar;
- one user-funded AI provider;
- no team permissions;
- no centralized backend.

## 3. Architecture

CreatorOS uses six logical layers:

1. **Presentation layer**
   - menus;
   - dialogs;
   - buttons;
   - sidebar;
   - user messages.

2. **Application layer**
   - coordinates use cases;
   - validates workflow order;
   - calls domain services.

3. **Domain layer**
   - planning;
   - capacity;
   - task generation;
   - recovery;
   - repurposing;
   - prioritization.

4. **Repository layer**
   - reads and writes sheet records;
   - maps headers to objects;
   - performs batch operations.

5. **Integration layer**
   - Google Calendar;
   - email;
   - AI providers.

6. **Infrastructure layer**
   - configuration;
   - IDs;
   - logging;
   - locks;
   - triggers;
   - errors.

## 4. Architectural rules

- UI functions must not directly manipulate sheets.
- Domain services must not depend on fixed column numbers.
- Repositories must use header maps.
- Secrets must never be stored in cells.
- Bulk operations must use batch reads and writes.
- Calendar sync must be idempotent.
- AI responses must be validated before persistence.
- Destructive actions require confirmation.
- All timestamps use ISO-compatible date objects and the user timezone.
- Each record uses an immutable business ID.

## 5. Suggested Apps Script file structure

```text
src/
  Main.gs
  Menu.gs
  Constants.gs
  Errors.gs
  ConfigService.gs
  IdService.gs
  ValidationService.gs
  LoggerService.gs
  TriggerService.gs

  repositories/
    BaseRepository.gs
    IdeaRepository.gs
    ContentRepository.gs
    TaskRepository.gs
    WorkflowRepository.gs
    PerformanceRepository.gs
    RepurposingRepository.gs

  services/
    SetupService.gs
    IdeaService.gs
    ContentService.gs
    WorkflowService.gs
    TaskService.gs
    PlanningService.gs
    CapacityService.gs
    CalendarService.gs
    RecoveryService.gs
    RepurposingService.gs
    DashboardService.gs
    NotificationService.gs
    AiService.gs

  providers/
    AiProvider.gs
    AnthropicProvider.gs
    OpenAIProvider.gs
    GeminiProvider.gs
    OpenRouterProvider.gs

  ui/
    UiService.gs
    DialogService.gs
    SidebarService.gs

  tests/
    TestRunner.gs
    RepositoryTests.gs
    DomainTests.gs
    CalendarTests.gs
    AiContractTests.gs
```

Apps Script does not enforce folders in the editor, but source control should preserve this logical structure.

## 6. Coding standards

- Use `const` and `let`; avoid `var`.
- Use JSDoc on public functions.
- Use named constants.
- Throw typed application errors.
- Keep public methods focused on one use case.
- Avoid deeply nested conditionals.
- Return structured result objects.
- Log correlation IDs for bulk operations.
- Never swallow exceptions silently.

## 7. Standard service result

```javascript
{
  success: true,
  code: "TASKS_CREATED",
  message: "12 tasks created.",
  data: {
    contentId: "CNT-000123",
    taskIds: ["TSK-000501"]
  },
  warnings: []
}
```

Failure:

```javascript
{
  success: false,
  code: "CALENDAR_PARTIAL_FAILURE",
  message: "4 of 5 events were created.",
  data: {
    created: 4,
    failed: 1
  },
  warnings: [],
  errors: [
    {
      recordId: "TSK-000611",
      code: "CALENDAR_PERMISSION_DENIED"
    }
  ]
}
```

## 8. Configuration strategy

### Script properties

Use only for immutable product-level settings:

- PRODUCT_VERSION
- SCHEMA_VERSION

### User properties

Use for user-specific secure settings:

- AI_PROVIDER
- AI_MODEL
- AI_API_KEY
- CALENDAR_ID
- REMINDER_ENABLED
- DEFAULT_REMINDER_MINUTES

### CONFIG sheet

Use for visible nonsecret settings:

- priority weights;
- capacity thresholds;
- enabled workflows;
- dashboard ranges;
- UI labels;
- feature flags.

## 9. Definition of engineering complete

The implementation is complete only when:

- all required sheets exist;
- schema validation passes;
- core workflows work without AI;
- duplicate calendar events are prevented;
- setup can be rerun safely;
- copied workbooks initialize correctly;
- tests and test evidence are delivered;
- installation and upgrade paths are documented;
- no critical or high-severity defect remains.

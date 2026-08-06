# 05 — Claude Code Implementation Brief

## Objective

Build CreatorOS v1 as a production-quality Google Sheets + Google Apps Script product using the attached documentation as the source of truth.

## Mandatory execution rules

1. Do not expand scope.
2. Do not replace Google Sheets with another platform.
3. Do not use the developer’s API key.
4. AI must remain optional.
5. Customer API keys must never appear in visible cells or logs.
6. Use immutable unique IDs.
7. Avoid hard-coded column indexes.
8. Prevent duplicate calendar events.
9. Preserve data when setup is rerun.
10. Record assumptions and deviations.

## Required output structure

Create:

- `/docs`
- `/apps-script`
- `/tests`
- `/sample-data`
- `/release`
- `README.md`
- `ASSUMPTIONS.md`
- `DEVIATIONS.md`
- `CHANGELOG.md`
- `TEST_RESULTS.md`

Suggested Apps Script files:

- `Main.gs`
- `Menu.gs`
- `Setup.gs`
- `Config.gs`
- `SheetRepository.gs`
- `IdService.gs`
- `IdeaService.gs`
- `ContentService.gs`
- `WorkflowService.gs`
- `TaskService.gs`
- `PlanningService.gs`
- `CalendarService.gs`
- `RecoveryService.gs`
- `DashboardService.gs`
- `NotificationService.gs`
- `AiService.gs`
- `providers/AnthropicProvider.gs`
- `providers/OpenAIProvider.gs`
- `providers/GeminiProvider.gs`
- `providers/OpenRouterProvider.gs`
- `LoggerService.gs`
- `ValidationService.gs`
- `UiService.gs`
- `Constants.gs`

## Engineering standards

- Use JSDoc.
- Keep functions small.
- Separate data access from business logic.
- Validate inputs.
- Use batch reads and writes.
- Use LockService for collision-sensitive operations.
- Use PropertiesService for secrets.
- Use structured error objects.
- Use named constants.
- Make bulk actions idempotent where possible.

## First build milestone

Deliver the workbook skeleton and core data services before UI polish.

Milestone must include:

- all required tabs;
- headers;
- protections;
- validations;
- unique-ID service;
- configuration service;
- sample workflow templates;
- basic setup;
- idea-to-content conversion;
- content-to-task generation;
- test evidence.

## QA handoff requirements

For every milestone provide:

- implemented requirements;
- unimplemented requirements;
- assumptions;
- known defects;
- test cases;
- screenshots or recordings where relevant;
- Apps Script project files;
- sample workbook;
- version number.

No milestone is accepted based only on screenshots.

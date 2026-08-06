# 29 — Permissions, Privacy, and Security Specification

## 1. Security objective

CreatorOS must minimize permissions, protect user secrets, and clearly disclose when data is sent to third-party AI providers.

## 2. Google permissions

Request only when required.

### Spreadsheet access

Purpose:

- read and write CreatorOS workbook data;
- create formulas and validations;
- update system status.

### Calendar access

Purpose:

- create, update, and inspect CreatorOS task events in the selected calendar.

CreatorOS must not scan unrelated calendar history beyond narrow operational windows.

### External requests

Purpose:

- send optional user-approved AI requests to the selected provider.

### Email permission

Purpose:

- send optional reminder emails to the user.

## 3. Staged authorization

- Core spreadsheet features first.
- Calendar scope only when calendar is enabled.
- External request scope only when AI is enabled.
- Email scope only when reminders are enabled.

## 4. API key handling

- Customer creates the API key.
- Customer bears provider charges.
- Key stored in User Properties.
- Key never stored in cells.
- Key never logged.
- Key never sent to the seller.
- Key can be removed through Settings.
- Connection tests must not reveal the key.

## 5. Data transmission disclosure

Before enabling AI, show:

> CreatorOS will send selected creator data to the AI provider you choose to generate recommendations. Your API account will be charged according to that provider's terms. CreatorOS does not centrally store your API key.

## 6. Data minimization

Send only data needed for the selected action.

Do not send:

- system logs;
- unrelated notes;
- hidden configuration;
- calendar details unrelated to CreatorOS;
- API keys;
- personal identifiers not required.

## 7. Logging controls

Logs may include:

- provider;
- model;
- request type;
- status;
- token usage;
- error category.

Logs must exclude:

- full API key;
- full prompt when it may contain private data;
- raw authorization headers;
- unrelated customer data.

## 8. Workbook privacy

The customer controls the Google Sheet and its sharing permissions.

Documentation must warn:

- do not share edit access publicly;
- do not place secrets in cells;
- review collaborators;
- use a dedicated calendar if preferred.

## 9. Destructive actions

Require confirmation for:

- deleting linked calendar events;
- replacing open tasks;
- resetting setup;
- clearing AI settings;
- bulk cancelling content;
- migration with schema changes.

## 10. Incident behavior

If a suspected key exposure occurs:

1. remove the key;
2. advise user to revoke it with provider;
3. clear any accidental cell or log value;
4. document incident;
5. fix root cause;
6. release security patch if needed.

## 11. Privacy notice minimum content

The launch package must disclose:

- what data is stored in the workbook;
- what data may be sent to AI providers;
- that Google and AI provider terms apply;
- that social accounts are not connected in v1;
- that the seller does not centrally receive customer content through normal use;
- that the customer controls deletion by deleting the workbook and provider keys.

## 12. Security test checklist

- API key absent from all sheets.
- API key absent from logs.
- Copying workbook does not copy prior user secrets.
- Calendar operations use selected calendar.
- AI requests require user enablement.
- Reminder triggers can be removed.
- Logs sanitize authorization data.
- Protected ranges cannot be edited accidentally.

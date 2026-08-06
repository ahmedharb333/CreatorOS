# 20 — Error Catalog

## 1. Error format

```javascript
{
  code: "TASK_DEPENDENCY_INVALID",
  severity: "ERROR",
  userMessage: "This task depends on a task that does not exist.",
  technicalMessage: "Dependency TSK-000123 not found.",
  recordId: "TSK-000200",
  recoverable: true,
  suggestedAction: "Select a valid dependency or remove it."
}
```

## 2. Severity

- INFO
- WARNING
- ERROR
- CRITICAL

## 3. Setup errors

| Code | Meaning | Recovery |
|---|---|---|
| SETUP_REQUIRED_FIELD_MISSING | mandatory setup missing | complete field |
| SETUP_INVALID_TIMEZONE | timezone invalid | select supported timezone |
| SETUP_INVALID_CAPACITY | hours invalid | enter positive value |
| SETUP_ALREADY_COMPLETE | rerun attempted | continue safely |

## 4. Schema errors

| Code | Meaning |
|---|---|
| SHEET_MISSING |
| HEADER_MISSING |
| HEADER_DUPLICATE |
| CONFIG_INVALID |
| SCHEMA_VERSION_MISMATCH |

A schema mismatch blocks write operations until resolved.

## 5. Record errors

| Code | Meaning |
|---|---|
| RECORD_NOT_FOUND |
| RECORD_ID_INVALID |
| RECORD_DUPLICATE |
| RECORD_VALIDATION_FAILED |
| RECORD_UPDATE_CONFLICT |

## 6. Content and workflow errors

| Code | Meaning |
|---|---|
| CONTENT_STATUS_TRANSITION_INVALID |
| CONTENT_PUBLISH_DATE_REQUIRED |
| WORKFLOW_NOT_FOUND |
| WORKFLOW_INVALID |
| TASKS_ALREADY_EXIST |
| TASK_DEPENDENCY_INVALID |
| TASK_DATE_INVALID |

## 7. Capacity and planning errors

| Code | Meaning |
|---|---|
| CAPACITY_NOT_CONFIGURED |
| PLAN_OVER_CAPACITY |
| PLAN_NOT_APPROVED |
| NO_AVAILABLE_SLOT |
| WEEK_ALREADY_APPROVED |

Over-capacity is normally a warning, not a blocking error.

## 8. Calendar errors

| Code | Meaning |
|---|---|
| CALENDAR_NOT_CONFIGURED |
| CALENDAR_PERMISSION_DENIED |
| CALENDAR_NOT_FOUND |
| CALENDAR_EVENT_MISSING |
| CALENDAR_EVENT_DUPLICATE |
| CALENDAR_INVALID_TIME |
| CALENDAR_PARTIAL_FAILURE |
| CALENDAR_QUOTA_EXCEEDED |

## 9. AI errors

| Code | Meaning |
|---|---|
| AI_DISABLED |
| AI_KEY_NOT_CONFIGURED |
| AI_AUTH_FAILED |
| AI_RATE_LIMITED |
| AI_MODEL_NOT_FOUND |
| AI_INVALID_REQUEST |
| AI_RESPONSE_SCHEMA_INVALID |
| AI_PROVIDER_UNAVAILABLE |
| AI_NETWORK_ERROR |
| AI_UNKNOWN_ERROR |

## 10. Trigger and notification errors

| Code | Meaning |
|---|---|
| TRIGGER_CREATION_FAILED |
| TRIGGER_DUPLICATE |
| TRIGGER_NOT_FOUND |
| EMAIL_PERMISSION_DENIED |
| EMAIL_SEND_FAILED |

## 11. User-facing behavior

- Never show raw stack traces by default.
- Show a short message and log reference.
- Provide “View details” where useful.
- State whether any records were changed.
- Preserve partial-success information.

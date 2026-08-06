# 16 — Workbook Schema

## 1. Workbook conventions

### Data types

- `TEXT`
- `NUMBER`
- `BOOLEAN`
- `DATE`
- `DATETIME`
- `ENUM`
- `ID`
- `URL`
- `JSON`

### Formula ownership

Formula columns must be protected. Users edit only input columns.

### Required metadata columns

Operational tables should include:

- `Created_At`
- `Updated_At`
- `Created_By`
- `Record_Status`

## 2. HOME

No authoritative records are stored here.

### Components

| Component | Type | Source |
|---|---|---|
| Setup status | indicator | SETUP |
| Tasks due today | KPI | TASKS |
| Overdue tasks | KPI | TASKS |
| Publishing this week | KPI | CONTENT |
| Capacity usage | KPI | WEEKLY_PLAN |
| Quick actions | buttons | Apps Script |
| Current product version | label | CHANGELOG/CONFIG |

## 3. SETUP schema

| Column | Type | Required | Validation |
|---|---|---:|---|
| Setting_Key | TEXT | Yes | unique |
| Setting_Label | TEXT | Yes | none |
| Setting_Value | TEXT | Conditional | rule by key |
| Setting_Type | ENUM | Yes | text, number, date, list, boolean |
| Required | BOOLEAN | Yes | checkbox |
| Validation_Rule | TEXT | No | named rule |
| Setup_Section | ENUM | Yes | Profile, Capacity, Platforms, Calendar, AI |
| Last_Updated | DATETIME | Yes | system |

Mandatory settings:

- CREATOR_NAME
- BRAND_NAME
- TIMEZONE
- PRIMARY_GOAL
- PRIMARY_PLATFORM
- WEEKLY_AVAILABLE_HOURS
- WORK_DAYS
- CONTENT_PILLARS
- ONBOARDING_STATUS

## 4. IDEAS schema

| Column | Type | Required | User editable | Rule |
|---|---|---:|---:|---|
| Idea_ID | ID | Yes | No | `IDE-######` |
| Created_Date | DATE | Yes | No | current date |
| Idea_Title | TEXT | Yes | Yes | max 160 chars |
| Description | TEXT | No | Yes | max 2,000 chars |
| Content_Pillar | ENUM | Yes | Yes | from setup |
| Target_Audience | TEXT | No | Yes | max 300 chars |
| Primary_Platform | ENUM | Yes | Yes | enabled platforms |
| Suggested_Format | ENUM | No | Yes | workflow formats |
| Strategic_Goal | ENUM | Yes | Yes | Awareness, Engagement, Leads, Sales, Authority |
| Effort_Score | NUMBER | Yes | Yes | integer 1–5 |
| Impact_Score | NUMBER | Yes | Yes | integer 1–5 |
| Confidence_Score | NUMBER | Yes | Yes | integer 1–5 |
| Priority_Score | NUMBER | Yes | No | computed |
| Status | ENUM | Yes | Yes | Captured, Reviewed, Approved, Converted, Rejected, Archived |
| Source | ENUM | No | Yes | Manual, AI, Audience, Research, Trend, Competitor |
| Notes | TEXT | No | Yes | max 2,000 chars |
| Created_At | DATETIME | Yes | No | system |
| Updated_At | DATETIME | Yes | No | system |

Priority calculation:

```text
Priority Score =
(Impact × Impact Weight)
+ (Confidence × Confidence Weight)
- (Effort × Effort Weight)
```

Default weights:

- Impact = 0.50
- Confidence = 0.30
- Effort = 0.20

## 5. CONTENT schema

| Column | Type | Required | Rule |
|---|---|---:|---|
| Content_ID | ID | Yes | `CNT-######` |
| Idea_ID | ID | No | valid Idea_ID |
| Title | TEXT | Yes | max 200 |
| Content_Pillar | ENUM | Yes | setup list |
| Campaign | TEXT | No | max 100 |
| Primary_Platform | ENUM | Yes | enabled platform |
| Format | ENUM | Yes | valid workflow format |
| Objective | ENUM | Yes | configured objective |
| CTA | TEXT | No | max 500 |
| Priority | ENUM | Yes | Low, Medium, High, Critical |
| Status | ENUM | Yes | defined PRD statuses |
| Planned_Publish_Date | DATE | Conditional | required after approval |
| Actual_Publish_Date | DATE | No | not before creation |
| Estimated_Hours | NUMBER | No | >=0 |
| Actual_Hours | NUMBER | No | >=0 |
| Source_Content_ID | ID | No | valid Content_ID |
| Repurpose_Group_ID | ID | No | `RPG-######` |
| Published_URL | URL | No | valid URL |
| Owner | TEXT | No | default creator |
| Notes | TEXT | No | max 3,000 |
| Created_At | DATETIME | Yes | system |
| Updated_At | DATETIME | Yes | system |

## 6. TASKS schema

| Column | Type | Required | Rule |
|---|---|---:|---|
| Task_ID | ID | Yes | `TSK-######` |
| Content_ID | ID | Yes | valid content |
| Task_Name | TEXT | Yes | max 160 |
| Task_Type | ENUM | Yes | workflow task types |
| Sequence | NUMBER | Yes | integer >=1 |
| Dependency_Task_ID | ID | No | same content unless approved |
| Priority | ENUM | Yes | Low, Medium, High, Critical |
| Status | ENUM | Yes | defined PRD statuses |
| Estimated_Minutes | NUMBER | Yes | 5–1,440 |
| Scheduled_Start | DATETIME | No | before end |
| Scheduled_End | DATETIME | No | after start |
| Due_Date | DATETIME | Yes | valid date |
| Completed_At | DATETIME | No | only when completed |
| Calendar_Event_ID | TEXT | No | Google event ID |
| Calendar_Sync_Status | ENUM | Yes | Not Synced, Synced, Changed, Missing, Failed |
| Recovery_Status | ENUM | Yes | Not Required, Required, Recovered, Deferred |
| Blocked_Reason | TEXT | No | required if Blocked |
| Notes | TEXT | No | max 2,000 |
| Created_At | DATETIME | Yes | system |
| Updated_At | DATETIME | Yes | system |

## 7. WORKFLOWS schema

| Column | Type | Required |
|---|---|---:|
| Workflow_ID | ID | Yes |
| Workflow_Name | TEXT | Yes |
| Platform | ENUM | Yes |
| Format | ENUM | Yes |
| Step_ID | ID | Yes |
| Task_Sequence | NUMBER | Yes |
| Task_Name | TEXT | Yes |
| Task_Type | ENUM | Yes |
| Default_Duration_Minutes | NUMBER | Yes |
| Offset_From_Publish_Days | NUMBER | Yes |
| Dependency_Sequence | NUMBER | No |
| Required | BOOLEAN | Yes |
| Active | BOOLEAN | Yes |

Composite uniqueness:

`Workflow_ID + Task_Sequence`

## 8. WEEKLY_PLAN schema

| Column | Type | Required |
|---|---|---:|
| Week_ID | ID | Yes |
| Week_Start | DATE | Yes |
| Week_End | DATE | Yes |
| Available_Minutes | NUMBER | Yes |
| Planned_Minutes | NUMBER | Yes |
| Utilization_Percent | NUMBER | Yes |
| Status | ENUM | Yes |
| Approved_At | DATETIME | No |
| Warning_Level | ENUM | Yes |

Warning levels:

- Normal: <= 85%
- Watch: >85% and <=100%
- Overloaded: >100% and <=120%
- Critical: >120%

## 9. REPURPOSING schema

| Column | Type | Required |
|---|---|---:|
| Repurpose_ID | ID | Yes |
| Source_Content_ID | ID | Yes |
| Target_Platform | ENUM | Yes |
| Target_Format | ENUM | Yes |
| Suggested_Angle | TEXT | Yes |
| Status | ENUM | Yes |
| New_Content_ID | ID | No |
| AI_Generated | BOOLEAN | Yes |
| Created_At | DATETIME | Yes |

## 10. PERFORMANCE schema

| Column | Type | Required |
|---|---|---:|
| Performance_ID | ID | Yes |
| Content_ID | ID | Yes |
| Platform | ENUM | Yes |
| Measurement_Date | DATE | Yes |
| Views | NUMBER | No |
| Impressions | NUMBER | No |
| Reach | NUMBER | No |
| Likes | NUMBER | No |
| Comments | NUMBER | No |
| Shares | NUMBER | No |
| Saves | NUMBER | No |
| Watch_Time_Minutes | NUMBER | No |
| Clicks | NUMBER | No |
| Leads | NUMBER | No |
| Sales | NUMBER | No |
| Revenue | NUMBER | No |
| Notes | TEXT | No |

## 11. AI_LOG schema

No prompt or key is stored.

| Column | Type |
|---|---|
| Request_ID | ID |
| Timestamp | DATETIME |
| User_Action | TEXT |
| Provider | ENUM |
| Model | TEXT |
| Prompt_Type | ENUM |
| Input_Tokens | NUMBER |
| Output_Tokens | NUMBER |
| Estimated_Cost | NUMBER |
| Status | ENUM |
| Error_Code | TEXT |
| Content_ID | ID |
| Notes | TEXT |

## 12. SYSTEM_LOG schema

| Column | Type |
|---|---|
| Log_ID | ID |
| Correlation_ID | TEXT |
| Timestamp | DATETIME |
| Severity | ENUM |
| Module | TEXT |
| Function | TEXT |
| User_Action | TEXT |
| Record_ID | TEXT |
| Message | TEXT |
| Technical_Detail | TEXT |
| Resolved | BOOLEAN |

## 13. Sheet protection

Protect:

- all ID columns;
- formula columns;
- logs;
- config;
- changelog;
- dashboard calculations.

Do not lock normal user-entry columns.

# 26 — Formula, Validation, and Formatting Catalog

## 1. Formula policy

- Formulas must be centralized and documented.
- Dynamic ranges are preferred.
- Formula errors must be wrapped where appropriate.
- User-editable fields must not contain formulas.
- Critical business logic belongs in Apps Script when formulas would be fragile.

## 2. Priority score

Conceptual formula:

```text
(Impact × Impact Weight)
+ (Confidence × Confidence Weight)
- (Effort × Effort Weight)
```

Recommended sheet formula pattern:

```excel
=IF(OR(J2="",K2="",L2=""),"",
 (K2*CONFIG!$B$2)+(L2*CONFIG!$B$3)-(J2*CONFIG!$B$4))
```

The actual implementation should use named ranges where possible.

## 3. Capacity utilization

```excel
=IF(Available_Minutes=0,"",Planned_Minutes/Available_Minutes)
```

Display as percentage.

Warning classification:

```excel
=IFS(
 Utilization<=0.85,"Normal",
 Utilization<=1,"Watch",
 Utilization<=1.2,"Overloaded",
 TRUE,"Critical"
)
```

## 4. Publishing completion rate

```text
Published content due in period ÷ Planned content due in period
```

Exclude Cancelled items.

## 5. Task completion rate

```text
Completed tasks ÷ Tasks due in period
```

Exclude Cancelled and Skipped unless a separate operational metric is required.

## 6. Repurposing ratio

```text
Derivative content items ÷ Published source content items
```

## 7. Engagement rate

Because platforms differ, the dashboard must label the selected formula.

Default:

```text
(Likes + Comments + Shares + Saves) ÷ Reach
```

Fallback to impressions when reach is unavailable.

## 8. Data validations

### Priority

- Low
- Medium
- High
- Critical

### Content status

- Backlog
- Approved
- In Production
- Ready
- Scheduled
- Published
- Paused
- Cancelled

### Task status

- Not Started
- Ready
- In Progress
- Blocked
- Completed
- Skipped
- Cancelled

### Calendar sync

- Not Synced
- Synced
- Changed
- Missing
- Failed

### Recovery status

- Not Required
- Required
- Recovered
- Deferred

### Idea status

- Captured
- Reviewed
- Approved
- Converted
- Rejected
- Archived

### Strategic goal

- Awareness
- Engagement
- Authority
- Leads
- Sales
- Community
- Retention

## 9. Numeric validation

- Effort, impact, confidence: integer 1–5
- Estimated minutes: 5–1,440
- Weekly hours: >0 and <=168
- Metrics: >=0
- Revenue: >=0
- Sequence: integer >=1

## 10. Date validation

- Scheduled_End > Scheduled_Start
- Actual_Publish_Date cannot precede Created_At
- Completed_At requires Completed status
- Publish date required for Approved content when tasks are generated
- Due date must be valid in creator timezone

## 11. Cross-record validation

- Idea_ID must exist when supplied
- Content_ID must exist for every task
- Dependency_Task_ID must exist
- Source_Content_ID cannot equal Content_ID
- Repurposing target cannot duplicate an accepted derivative without warning
- Calendar_Event_ID cannot be attached to two tasks

## 12. Conditional formatting

### TASKS

- Overdue and open: red background and label
- Due today: amber
- Completed: green
- Blocked: purple/gray
- Critical priority: bold indicator
- Sync failed: red icon/label

### CONTENT

- Publishing within 48 hours with incomplete tasks: red
- Ready: green
- Scheduled: blue
- Paused: gray
- Cancelled: muted

### WEEKLY_PLAN

- <=85%: healthy
- 86–100%: warning
- 101–120%: overloaded
- >120%: critical

## 13. Named ranges

Recommended:

- CFG_IMPACT_WEIGHT
- CFG_CONFIDENCE_WEIGHT
- CFG_EFFORT_WEIGHT
- CFG_WEEKLY_HOURS
- CFG_TIMEZONE
- CFG_CALENDAR_ID
- CFG_PRIMARY_PLATFORM
- CFG_CONTENT_PILLARS
- CFG_WORK_DAYS
- CFG_CAPACITY_WARNING
- CFG_CAPACITY_CRITICAL

## 14. Protection rules

Protect:

- IDs
- timestamps
- formula columns
- logs
- configuration internals
- dashboard calculations
- changelog

Allow user editing only through intended input fields or dialogs.

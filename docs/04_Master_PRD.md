# 04 — Master Product Requirements Document

## 1. Document control

- Product: CreatorOS
- Version: 1.0
- Release target: Google Sheets MVP
- Owner: Product Owner
- Implementation: Claude Code
- QA authority: Product QA review
- Status: Approved baseline for implementation

## 2. Product summary

CreatorOS is a Google Sheets and Google Apps Script product that enables solo creators to manage content strategy, planning, production, scheduling, execution, recovery, repurposing, and review from one system.

The core product must remain functional without AI. AI features are optional and require the customer’s own API key.

## 3. Users

### 3.1 Primary user

Solo content creator.

### 3.2 User assumptions

The user:

- has a Google account;
- can copy a Google Sheet;
- can authorize Apps Script;
- may or may not understand APIs;
- may use Google Calendar;
- manages one creator brand;
- works alone;
- manually enters performance data.

## 4. Core user journey

1. User copies CreatorOS.
2. User runs setup.
3. User enters goals, platforms, capacity, and content pillars.
4. User selects workflow templates.
5. User adds ideas.
6. User promotes an idea into a content item.
7. CreatorOS generates production tasks.
8. User schedules or accepts recommended dates.
9. User pushes tasks to Google Calendar.
10. User completes tasks.
11. CreatorOS detects overdue work and offers recovery.
12. User publishes content.
13. User enters performance data.
14. CreatorOS updates dashboard and recommendations.

## 5. Sheet architecture

The workbook should contain the following tabs.

### 5.1 `HOME`

Purpose:

- product identity;
- setup status;
- navigation;
- summary KPIs;
- quick actions.

Required components:

- CreatorOS logo/title
- tagline
- Setup button
- Add Idea button
- Create Content button
- Generate Weekly Plan button
- Push to Calendar button
- Run Recovery button
- Open Today View button
- KPI cards

### 5.2 `SETUP`

Fields:

- creator name
- brand name
- timezone
- primary goal
- primary platform
- secondary platforms
- weekly available hours
- work days
- preferred work blocks
- publishing frequency by platform
- newsletter frequency
- content pillars
- default reminder time
- calendar ID
- AI enabled
- AI provider
- model name
- API key status
- onboarding status

Requirements:

- required-field validation;
- dropdowns where possible;
- no API key shown in cells;
- configuration status indicator.

### 5.3 `IDEAS`

Columns:

- Idea_ID
- Created_Date
- Idea_Title
- Description
- Content_Pillar
- Target_Audience
- Primary_Platform
- Suggested_Format
- Strategic_Goal
- Effort_Score
- Impact_Score
- Confidence_Score
- Priority_Score
- Status
- Source
- Notes

Priority formula:

`Priority_Score = weighted impact + confidence - effort`

Weights must be configurable.

### 5.4 `CONTENT`

Columns:

- Content_ID
- Idea_ID
- Title
- Content_Pillar
- Campaign
- Primary_Platform
- Format
- Objective
- CTA
- Priority
- Status
- Planned_Publish_Date
- Actual_Publish_Date
- Estimated_Hours
- Actual_Hours
- Source_Content_ID
- Repurpose_Group_ID
- Published_URL
- Owner
- Notes
- Created_At
- Updated_At

Allowed statuses:

- Backlog
- Approved
- In Production
- Ready
- Scheduled
- Published
- Paused
- Cancelled

### 5.5 `TASKS`

Columns:

- Task_ID
- Content_ID
- Task_Name
- Task_Type
- Sequence
- Dependency_Task_ID
- Priority
- Status
- Estimated_Minutes
- Scheduled_Start
- Scheduled_End
- Due_Date
- Completed_At
- Calendar_Event_ID
- Calendar_Sync_Status
- Recovery_Status
- Blocked_Reason
- Notes
- Created_At
- Updated_At

Allowed statuses:

- Not Started
- Ready
- In Progress
- Blocked
- Completed
- Skipped
- Cancelled

### 5.6 `WORKFLOWS`

Columns:

- Workflow_ID
- Workflow_Name
- Platform
- Format
- Task_Sequence
- Task_Name
- Task_Type
- Default_Duration
- Offset_From_Publish
- Required
- Active

Default workflows must include:

- YouTube long-form
- YouTube Short
- Instagram Reel
- LinkedIn post
- Newsletter
- Podcast episode

### 5.7 `WEEKLY_PLAN`

Purpose:

- show current week;
- planned workload;
- capacity utilization;
- unallocated tasks;
- overload warnings;
- approval state.

### 5.8 `TODAY`

Purpose:

- highest-priority work;
- overdue tasks;
- current-day tasks;
- at-risk content;
- quick completion actions.

### 5.9 `CALENDAR`

Purpose:

- weekly and monthly publishing overview;
- production deadlines;
- filter by platform and status.

### 5.10 `REPURPOSING`

Columns:

- Repurpose_ID
- Source_Content_ID
- Target_Platform
- Target_Format
- Suggested_Angle
- Status
- New_Content_ID
- AI_Generated
- Created_At

### 5.11 `PERFORMANCE`

Columns:

- Performance_ID
- Content_ID
- Platform
- Measurement_Date
- Views
- Impressions
- Reach
- Likes
- Comments
- Shares
- Saves
- Watch_Time
- Clicks
- Leads
- Sales
- Revenue
- Notes

### 5.12 `DASHBOARD`

Required KPIs:

- content planned
- content published
- publishing completion rate
- task completion rate
- overdue task count
- capacity utilization
- content by platform
- content by pillar
- repurposing ratio
- average views
- average engagement
- consistency indicator

### 5.13 `AI_LOG`

Columns:

- Request_ID
- Timestamp
- User_Action
- Provider
- Model
- Prompt_Type
- Input_Tokens
- Output_Tokens
- Estimated_Cost
- Status
- Error_Code
- Content_ID
- Notes

Prompts and API keys must not be logged in full.

### 5.14 `SYSTEM_LOG`

Columns:

- Log_ID
- Timestamp
- Severity
- Module
- Function
- User_Action
- Record_ID
- Message
- Technical_Detail
- Resolved

### 5.15 `CONFIG`

Hidden/protected configuration values.

### 5.16 `CHANGELOG`

Version, date, change, impact, migration instruction.

## 6. Functional requirements

### FR-001 — Initial setup

The system shall provide a guided setup process.

Acceptance criteria:

- Setup cannot be marked complete until mandatory fields are populated.
- The user can rerun setup.
- Rerunning setup must not delete existing content or tasks.
- API keys are stored only in User Properties or Script Properties as appropriate.

### FR-002 — Unique record IDs

The system shall generate immutable unique IDs for ideas, content, tasks, workflows, and logs.

Acceptance criteria:

- IDs are never formula-based row numbers.
- Sorting rows does not change IDs.
- Deleted IDs are not reused.
- ID collisions are handled.

### FR-003 — Idea capture

The user shall add and prioritize ideas.

Acceptance criteria:

- Required fields are validated.
- Priority score recalculates when component scores change.
- An idea can be converted to content.
- Conversion stores the source Idea_ID.

### FR-004 — Content creation

The user shall create a content record manually or from an idea.

Acceptance criteria:

- Content_ID is generated.
- Workflow is selected based on platform and format.
- User can override the selected workflow.
- No tasks are generated without confirmation.

### FR-005 — Task generation

The system shall generate tasks from the selected workflow.

Acceptance criteria:

- Tasks follow workflow sequence.
- Task dates calculate backward from planned publish date.
- Estimated time is copied from workflow defaults.
- Existing tasks are not duplicated.
- Regeneration requires explicit overwrite or append choice.

### FR-006 — Capacity calculation

The system shall compare scheduled task duration with available weekly hours.

Acceptance criteria:

- Weekly capacity comes from Setup.
- Utilization percentage is visible.
- Over 100% produces a warning.
- System does not silently remove tasks.
- User can approve an overloaded week.

### FR-007 — Weekly planning

The user shall create a weekly execution plan.

Acceptance criteria:

- Plan includes tasks due or scheduled in the selected week.
- Unscheduled critical tasks are shown.
- High-priority content receives precedence.
- User approval is required before calendar push.

### FR-008 — Today view

The system shall display prioritized daily tasks.

Priority order:

1. overdue critical tasks;
2. tasks blocking upcoming publishing;
3. tasks due today;
4. high-impact tasks;
5. optional tasks.

Acceptance criteria:

- Completed tasks disappear from active list.
- Blocked tasks show reason.
- At-risk content is highlighted.
- User can mark complete from Today view.

### FR-009 — Google Calendar connection

The user shall connect a Google Calendar.

Acceptance criteria:

- The system lists accessible calendars or accepts a valid Calendar ID.
- Connection test is available.
- Authorization failure produces a clear message.
- Calendar ID is stored in configuration.

### FR-010 — Calendar event creation

The system shall create calendar events for selected tasks.

Event fields:

- title;
- start and end;
- description;
- Task_ID;
- Content_ID;
- link to workbook;
- reminder.

Acceptance criteria:

- Each task stores Calendar_Event_ID.
- Duplicate events are prevented.
- Only approved tasks are pushed.
- Failed events are logged.
- Partial success is reported.

### FR-011 — Calendar updates

When a linked task date changes, the user shall be able to update its calendar event.

Acceptance criteria:

- Update uses stored event ID.
- Missing events are detected.
- User may recreate a missing event.
- Completed events are not deleted automatically.

### FR-012 — Overdue detection

The system shall detect incomplete tasks past their due date or scheduled end.

Acceptance criteria:

- Detection runs on workbook open and optional daily trigger.
- Overdue status is visible.
- Completed, skipped, and cancelled tasks are excluded.

### FR-013 — Recovery workflow

The user shall recover overdue tasks.

Recovery options:

- move to next available slot;
- move lower-priority task;
- reduce scope;
- defer content;
- skip task;
- cancel content;
- manually reschedule.

Acceptance criteria:

- Recovery action is logged.
- Calendar event is updated where applicable.
- Impacted publish date is recalculated or flagged.
- System does not automatically cancel content.

### FR-014 — Repurposing

The system shall create derivative content from source content.

Acceptance criteria:

- Source_Content_ID is retained.
- One source may have multiple derivatives.
- User may accept, edit, or reject suggestions.
- Accepted suggestion creates a new content record.

### FR-015 — Performance entry

The user shall enter post-publication metrics manually.

Acceptance criteria:

- Only published content is selectable by default.
- Multiple measurement dates are supported.
- Dashboard uses latest or aggregated values according to metric definition.

### FR-016 — Dashboard

The dashboard shall summarize execution and performance.

Acceptance criteria:

- Filters by date, platform, and content pillar.
- KPIs update without manual formula editing.
- Empty states display zero or “No data,” not formula errors.

### FR-017 — AI provider setup

The user shall optionally configure an AI provider.

Initial providers:

- Anthropic
- OpenAI
- Google Gemini
- OpenRouter

Acceptance criteria:

- Provider can be changed.
- API key is not stored in a visible cell.
- Connection test is available.
- AI features remain disabled until test succeeds.
- Core product remains functional without AI.

### FR-018 — AI request management

The system shall send structured prompts to the selected provider.

Acceptance criteria:

- Prompt includes only necessary context.
- User approves AI-generated plans before records are created.
- Errors do not corrupt workbook data.
- Usage metadata is logged.
- API response parsing is validated.

### FR-019 — AI weekly suggestions

The user shall request a weekly plan suggestion.

Inputs:

- creator profile;
- goals;
- platforms;
- capacity;
- content pillars;
- active content;
- recent performance;
- overdue tasks.

Outputs:

- recommended content;
- recommended task priorities;
- workload warning;
- repurposing opportunities;
- rationale.

Acceptance criteria:

- Output must be editable.
- No calendar event is created automatically.
- Recommendations exceeding capacity are labeled.

### FR-020 — Notifications

The system may send optional email reminders.

Acceptance criteria:

- User explicitly enables reminders.
- Reminder frequency is configurable.
- Emails include task and workbook link.
- Trigger setup and removal are available.

## 7. AI architecture requirements

### 7.1 Provider abstraction

All providers must implement a common interface:

- `testConnection()`
- `generateWeeklyPlan(context)`
- `generateIdeas(context)`
- `generateRepurposing(context)`
- `analyzePerformance(context)`

### 7.2 Key ownership

- Customer owns the API account.
- Customer pays provider usage.
- Seller does not receive or centrally store customer keys.
- The product documentation must disclose expected API charges.

### 7.3 Prompt governance

Prompts must:

- request structured JSON;
- include schema expectations;
- define maximum output volume;
- prohibit invented performance data;
- identify assumptions;
- avoid personal or sensitive information unless explicitly entered by user.

### 7.4 Fallback

If AI fails:

- display error;
- retain user data;
- allow retry;
- allow provider switch;
- allow rule-based workflow continuation.

## 8. Non-functional requirements

### NFR-001 — Performance

Normal menu actions should complete within practical Apps Script execution limits.

### NFR-002 — Reliability

Bulk operations must handle partial failure and report affected records.

### NFR-003 — Security

- no API key in sheet cells;
- no API key in logs;
- minimal OAuth scopes;
- protected system sheets;
- input sanitization;
- no external transmission without user action.

### NFR-004 — Usability

- primary actions accessible from custom menu and Home tab;
- instructions written for nontechnical users;
- errors state what happened and what to do next.

### NFR-005 — Maintainability

- modular Apps Script files;
- documented functions;
- configuration separated from logic;
- no hard-coded column numbers where avoidable;
- header-based column mapping.

### NFR-006 — Portability

The product must work when a customer copies the spreadsheet.

### NFR-007 — Localization readiness

Dates, timezone, and text labels should be configurable. Full multilingual UI is not required in v1.

### NFR-008 — Data integrity

- no destructive action without confirmation;
- backup/export guidance;
- unique IDs;
- atomic-like update patterns where possible.

## 9. Menu structure

Custom menu: `CreatorOS`

- Open Home
- Run Setup
- Add Idea
- Create Content
- Generate Tasks
- Build Weekly Plan
- Push Tasks to Calendar
- Sync Calendar Events
- Run Recovery
- Generate AI Suggestions
- Refresh Dashboard
- Settings
- Help
- View Logs

## 10. Required dialogs

- Setup wizard
- Add idea
- Create content
- Select workflow
- Generate tasks confirmation
- Weekly-plan approval
- Calendar connection
- Calendar push summary
- Recovery options
- AI provider setup
- AI suggestion review
- Error details

## 11. Permissions

The implementation should request only permissions necessary for:

- spreadsheet access;
- calendar event access;
- optional email sending;
- external API calls;
- user properties.

Permissions must be documented before authorization.

## 12. Error handling

Every user-facing error must include:

- what failed;
- likely reason;
- affected record;
- whether data was changed;
- recommended action;
- log reference.

Severity levels:

- INFO
- WARNING
- ERROR
- CRITICAL

## 13. Audit and logging

Log:

- setup completion;
- task generation;
- calendar push;
- calendar update;
- recovery action;
- AI request status;
- bulk operation result;
- configuration change;
- critical error.

Do not log API keys or full sensitive prompt content.

## 14. Acceptance test scenarios

### AT-001 — New user setup

A new user completes setup and receives a valid configuration status.

### AT-002 — YouTube workflow

A user creates a YouTube video with a publish date and receives the correct ordered production tasks.

### AT-003 — Capacity overload

A generated week exceeds available time and the system presents a warning without deleting tasks.

### AT-004 — Calendar push

Five approved tasks create five unique calendar events and store event IDs.

### AT-005 — Duplicate prevention

Running calendar push again does not create duplicate events.

### AT-006 — Recovery

An overdue editing task is rescheduled and its linked calendar event is updated.

### AT-007 — AI disabled

All non-AI functionality works without an API key.

### AT-008 — Invalid API key

Connection test fails clearly and no key is exposed.

### AT-009 — AI structured output

A valid AI response is reviewed before records are written.

### AT-010 — Partial API failure

One failed calendar or AI operation does not corrupt other records.

### AT-011 — Sheet copy

A copied workbook initializes correctly for a new user.

### AT-012 — Empty dashboard

Dashboard displays valid empty states.

## 15. Definition of done

A feature is complete only when:

- code is implemented;
- acceptance criteria pass;
- errors are handled;
- logs are created where required;
- documentation is updated;
- no critical regression is introduced;
- user-facing text is understandable;
- QA evidence is recorded.

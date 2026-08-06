# 25 — Detailed UI Specification

## 1. UX objective

CreatorOS should feel like an operating console, not a spreadsheet template.

The interface must make the next action obvious and reduce direct interaction with raw tables wherever practical.

## 2. Design rules

- No more than seven primary navigation items visible at once.
- One dominant action per screen.
- Buttons use action verbs.
- Red is reserved for errors, overdue work, and destructive actions.
- Green indicates completion or healthy status.
- Amber indicates warning.
- Blue indicates user input or primary action.
- Gray indicates calculated or locked fields.
- Formula cells are visually distinct and protected.
- Empty states explain what to do next.

## 3. HOME

### Header

- Product name: CreatorOS
- Tagline: Plan. Execute. Publish. Grow.
- Version indicator
- Setup status
- AI status
- Calendar status

### KPI cards

1. Tasks today
2. Overdue tasks
3. Content publishing this week
4. Weekly capacity usage
5. Current completion rate
6. Repurposing opportunities

### Primary actions

- Add Idea
- Create Content
- Build Weekly Plan
- Push Approved Tasks
- Run Recovery
- Open Today

### Empty state

> CreatorOS is ready. Complete Setup, add your first idea, and build your first content workflow.

## 4. SETUP

### Layout sections

1. Creator Profile
2. Goals and Platforms
3. Weekly Capacity
4. Publishing Cadence
5. Calendar Connection
6. AI Connection
7. Completion Review

### Validation behavior

- Invalid fields display inline guidance.
- Completion button remains disabled until mandatory fields pass.
- API key field must be in a secure HTML dialog, not the sheet.
- Calendar test button displays success or actionable failure.

### Setup completion message

> Setup complete. CreatorOS can now build a plan based on your actual capacity.

## 5. IDEAS

### Table behavior

- Freeze header.
- Filter row enabled.
- New idea uses a modal or sidebar form.
- Priority score is calculated.
- Approved ideas show `Convert to Content`.
- Converted ideas show linked Content_ID.

### Add Idea dialog

Fields:

- Title
- Description
- Pillar
- Platform
- Format
- Goal
- Effort
- Impact
- Confidence
- Source
- Notes

Buttons:

- Save
- Save and Add Another
- Cancel

## 6. CONTENT

### Table behavior

- Status uses colored chips.
- Publish date has date picker.
- Content_ID is clickable where practical.
- Source content relationship is visible.
- Overdue production risk displays warning icon.

### Create Content dialog

Step 1: Content details  
Step 2: Workflow selection  
Step 3: Publish date and capacity preview  
Step 4: Task preview  
Step 5: Confirm creation

The user must see estimated total production time before confirmation.

## 7. TASKS

### Views

- All Tasks
- Open Tasks
- Overdue
- Blocked
- Completed

### Quick actions

- Start
- Complete
- Block
- Reschedule
- Push to Calendar
- Open Content

### Conditional formatting

- Critical priority: strong warning
- Overdue: red
- Due today: amber
- Completed: green
- Blocked: purple or neutral warning tone
- Not synced: gray indicator
- Sync failed: red indicator

## 8. WEEKLY_PLAN

### Header

- Week selector
- Available hours
- Planned hours
- Capacity percentage
- Warning level
- Approval status

### Main areas

- Monday through Sunday task blocks
- Unscheduled tasks
- At-risk content
- Capacity warning
- Recommendation panel

### Actions

- Build Plan
- Auto-Allocate
- Review Overload
- Approve Week
- Push to Calendar
- Reset Unapproved Plan

## 9. TODAY

### Priority panel

Display:

- top priority task;
- why it matters;
- related content;
- estimated duration;
- publishing risk.

### Sections

1. Must Do Today
2. Overdue
3. If Time Allows
4. Publishing Soon
5. Blocked Tasks

### Actions

- Start Task
- Mark Complete
- Block
- Reschedule
- Run Recovery

## 10. CALENDAR

### Purpose

Provide a visual publishing and production overview.

### Filters

- week/month;
- platform;
- pillar;
- status;
- content type.

### Display

- publishing milestones;
- production deadlines;
- unscheduled high-priority tasks;
- synchronization status.

## 11. REPURPOSING

### Cards or table

Each suggestion shows:

- source content;
- target platform;
- target format;
- angle;
- estimated effort;
- AI or rule-based label.

Actions:

- Accept
- Edit
- Reject
- Create Content

## 12. PERFORMANCE

### Entry dialog

- Content
- Measurement date
- Platform
- Metrics
- Notes

### Rules

- Numeric validation
- No negative values
- Published content shown first
- Multiple measurements allowed

## 13. DASHBOARD

### Sections

1. Execution
2. Publishing
3. Capacity
4. Repurposing
5. Performance
6. Recommendations

### Charts

- planned vs published;
- tasks completed by week;
- content by platform;
- content by pillar;
- capacity usage;
- overdue trend;
- repurposing ratio;
- top content.

Avoid decorative charts without decisions attached.

## 14. AI review dialog

Must display:

- provider;
- model;
- estimated scope;
- recommendations;
- warnings;
- assumptions.

Actions:

- Accept Selected
- Edit
- Reject
- Regenerate
- Cancel

No records are written until accepted.

## 15. Recovery dialog

Display:

- overdue task;
- impacted content;
- publish deadline;
- dependency impact;
- available actions;
- recommended action.

Buttons:

- Apply Recommended
- Choose Another Action
- Cancel

## 16. User messages

### Success

> 8 tasks were created for “Nokia Case Study.”

### Warning

> This plan uses 112% of your weekly capacity. Approve it only if the workload is realistic.

### Partial failure

> 7 calendar events were synchronized. 1 failed. No task data was lost.

### Error

> CreatorOS could not connect to the selected calendar. Check authorization and calendar access.

## 17. Accessibility

- Do not rely on color alone.
- Use icons or labels with status colors.
- Maintain readable contrast.
- Use clear labels.
- Avoid tiny text.
- Support keyboard navigation in dialogs where possible.

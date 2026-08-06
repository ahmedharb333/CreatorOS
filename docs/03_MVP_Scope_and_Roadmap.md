# 03 — MVP Scope and Roadmap

## 1. MVP definition

CreatorOS v1 is a Google Sheets-based content execution system with optional Google Calendar and user-funded AI integrations.

## 2. In-scope modules

### 2.1 Setup

- Creator profile
- Content goals
- Platform selection
- Weekly available hours
- Preferred working days
- Publishing cadence
- Content pillars
- AI-provider setup
- Calendar setup

### 2.2 Idea management

- Idea capture
- Idea scoring
- Content pillar assignment
- Platform assignment
- Status tracking
- Priority ranking

### 2.3 Content planning

- Monthly view
- Weekly plan
- Capacity check
- Publishing cadence
- Content type selection
- Content dependencies

### 2.4 Production workflow

- Configurable production templates
- Automatic task creation
- Task estimates
- Due dates
- Dependencies
- Task status

### 2.5 Daily execution

- Today dashboard
- Priority tasks
- Overdue tasks
- Upcoming deadlines
- At-risk content
- Completion controls

### 2.6 Calendar integration

- Push selected tasks to Google Calendar
- Create event reminders
- Store event IDs
- Update event when task changes
- Prevent duplicate events
- Remove linked calendar event through controlled action

### 2.7 Recovery engine

- Detect overdue tasks
- Offer rescheduling
- Identify deadline impact
- Suggest workload reduction
- Protect high-priority content
- Log recovery actions

### 2.8 Repurposing

- Link source and derivative content
- Suggest derivative formats
- Generate derivative tasks
- Track repurposing ratio

### 2.9 Analytics

- Planned vs published
- Task completion
- Publishing consistency
- Content by platform
- Content by pillar
- Overdue volume
- Repurposing volume
- Manual performance entry

### 2.10 Optional AI

- Weekly ideas
- Titles
- hooks
- content angles
- repurposing suggestions
- weekly-plan recommendation
- performance observations
- user-provided API key
- provider selection

## 3. Out-of-scope modules

- Direct social-media publishing
- Social API analytics
- Team collaboration
- Client workspaces
- Payments and licensing server
- Mobile application
- Native push notifications
- CRM
- asset storage
- video editing
- image generation
- automated email newsletters
- autonomous publishing
- seller-funded API usage

## 4. Release stages

### Release 0 — Internal prototype

Purpose: validate workflow logic.

Includes:

- setup;
- ideas;
- content database;
- task generation;
- today view;
- manual calendar export.

Exit criteria:

- one complete YouTube workflow runs without formula failure;
- task generation is accurate;
- capacity calculation works;
- no duplicate IDs.

### Release 1 — Closed beta

Includes:

- Google Calendar push;
- recovery workflow;
- dashboard;
- onboarding;
- sample workspace;
- protected formula ranges.

Exit criteria:

- 5 external testers;
- setup completion by 4 testers;
- no critical data-loss issue;
- calendar events created without duplication.

### Release 2 — Paid MVP

Includes:

- optional AI integration;
- license and version page;
- polished documentation;
- error logging;
- feedback form;
- launch package.

Exit criteria:

- stable installation;
- documented permissions;
- tested API setup;
- refund and support policy;
- product-page copy completed.

## 5. Prioritization

### Must have

- Setup wizard
- Creator profile
- Weekly capacity
- Content database
- Task generation
- Today view
- Calendar push
- Overdue detection
- Recovery actions
- Dashboard
- Optional API key
- Error handling

### Should have

- Repurposing suggestions
- Weekly AI plan
- Email reminders
- sample content
- provider selection
- configurable workflows

### Could have

- campaign planning
- custom branding
- advanced charts
- content score
- streak tracking
- monthly review report

### Will not have in v1

- direct publishing
- team collaboration
- automated analytics import
- native mobile app
- subscriptions

## 6. Indicative build sequence

1. Data model
2. Sheet structure
3. ID generation
4. Setup and configuration
5. Content database
6. Workflow templates
7. Task generation
8. Today dashboard
9. Calendar integration
10. Recovery engine
11. Analytics
12. AI provider abstraction
13. Documentation
14. QA and release

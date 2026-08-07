/**
 * Constants.gs — CreatorOS canonical constants.
 *
 * Single source of truth for sheet names, immutable-ID prefixes, controlled
 * vocabularies (enums), and the workbook schema. `WorkbookService` builds the
 * spreadsheet from `SCHEMA`, and the repositories map records from it, so this
 * file is the one place a schema change is made.
 *
 * Apps Script concatenates every file into one global scope — there is no module
 * system. These constants are therefore plain globals, frozen to prevent mutation.
 *
 * @see docs/16_Workbook_Schema.md
 * @see docs/04_Master_PRD.md
 * @see ASSUMPTIONS.md (C1, C2, G1, G2, D1)
 */

/** Product + schema version markers (docs 22 §5). */
const VERSION = Object.freeze({
  PRODUCT: '1.0.0',
  SCHEMA: 1,
});

/** Canonical tab names. C1: the weekly tab is WEEKLY_PLAN, not WEEK. */
const SHEETS = Object.freeze({
  HOME: 'HOME',
  SETUP: 'SETUP',
  IDEAS: 'IDEAS',
  CONTENT: 'CONTENT',
  TASKS: 'TASKS',
  WORKFLOWS: 'WORKFLOWS',
  WEEKLY_PLAN: 'WEEKLY_PLAN',
  TODAY: 'TODAY',
  CALENDAR: 'CALENDAR',
  REPURPOSING: 'REPURPOSING',
  PERFORMANCE: 'PERFORMANCE',
  DASHBOARD: 'DASHBOARD',
  AI_LOG: 'AI_LOG',
  SYSTEM_LOG: 'SYSTEM_LOG',
  RECOVERY_LOG: 'RECOVERY_LOG',
  CONFIG: 'CONFIG',
  CHANGELOG: 'CHANGELOG',
});

/** Sheets a creator sees in Creator Mode (ADR-019). Everything else is a system sheet. */
const CREATOR_SHEETS = Object.freeze([SHEETS.HOME, SHEETS.TODAY, SHEETS.IDEAS, SHEETS.CONTENT, SHEETS.DASHBOARD]);

/** Immutable business-ID prefixes — G1 registry. Format: `XXX-000000`. */
const ID_PREFIX = Object.freeze({
  CREATOR: 'CRT',
  IDEA: 'IDE',
  CONTENT: 'CNT',
  TASK: 'TSK',
  WORKFLOW: 'WKF', // D-02: standardized from doc-06 "WF-"
  WORKFLOW_STEP: 'WFS',
  WEEK: 'WEK',
  REPURPOSE: 'RPS',
  REPURPOSE_GROUP: 'RPG',
  PERFORMANCE: 'PER',
  AI_REQUEST: 'AIR',
  LOG: 'LOG',
  RECOVERY_LOG: 'RCV',
  CORRELATION: 'COR',
});

/** Zero-padding width for the numeric part of every ID. */
const ID_PAD = 6;

/** Controlled vocabularies. */
const ENUMS = Object.freeze({
  // C2: approved 7-value standard.
  STRATEGIC_GOAL: ['Awareness', 'Engagement', 'Authority', 'Leads', 'Sales', 'Community', 'Retention'],
  IDEA_STATUS: ['Captured', 'Reviewed', 'Approved', 'Converted', 'Rejected', 'Archived'],
  IDEA_SOURCE: ['Manual', 'AI', 'Audience', 'Research', 'Trend', 'Competitor'],
  CONTENT_STATUS: ['Backlog', 'Approved', 'In Production', 'Ready', 'Scheduled', 'Published', 'Paused', 'Cancelled'],
  // Content Objective = the funnel job of ONE content piece (distinct from the idea-level Strategic Goal).
  // Verb/stage vocabulary is deliberately disjoint from STRATEGIC_GOAL to prevent conceptual overlap.
  // See docs/CONCEPTS_GOAL_VS_OBJECTIVE.md (correction item 3).
  CONTENT_OBJECTIVE: ['Reach', 'Engage', 'Educate', 'Convert', 'Nurture', 'Monetize'],
  TASK_STATUS: ['Not Started', 'Ready', 'In Progress', 'Blocked', 'Completed', 'Skipped', 'Cancelled'],
  PRIORITY: ['Low', 'Medium', 'High', 'Critical'],
  CALENDAR_SYNC: ['Not Synced', 'Synced', 'Changed', 'Missing', 'Failed'],
  RECOVERY_STATUS: ['Not Required', 'Required', 'Recovered', 'Deferred'],
  WARNING_LEVEL: ['Normal', 'Watch', 'Overloaded', 'Critical'],
  WEEK_STATUS: ['Draft', 'Approved', 'Archived'],
  SETTING_TYPE: ['text', 'number', 'date', 'list', 'boolean'],
  SETUP_SECTION: ['Profile', 'Capacity', 'Platforms', 'Calendar', 'AI'],
  SEVERITY: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
  AI_PROVIDER: ['Anthropic', 'OpenAI', 'Gemini', 'OpenRouter'],
  // Default platform + format catalogs (derived from the default workflow library, docs 27).
  PLATFORM: ['YouTube', 'Instagram', 'LinkedIn', 'Newsletter', 'Podcast', 'Blog', 'X'],
  FORMAT: [
    'YouTube Long-Form', 'YouTube Short', 'Instagram Reel', 'LinkedIn Post',
    'LinkedIn Carousel', 'Newsletter', 'Podcast Episode', 'Blog Article',
  ],
});

/** CONFIG keys and their defaults (docs 26 §13, 15 §8). Named ranges point at these value cells. */
const CONFIG_DEFAULTS = Object.freeze([
  { key: 'IMPACT_WEIGHT', label: 'Priority: impact weight', value: 0.5, type: 'number', namedRange: 'CFG_IMPACT_WEIGHT' },
  { key: 'CONFIDENCE_WEIGHT', label: 'Priority: confidence weight', value: 0.3, type: 'number', namedRange: 'CFG_CONFIDENCE_WEIGHT' },
  { key: 'EFFORT_WEIGHT', label: 'Priority: effort weight', value: 0.2, type: 'number', namedRange: 'CFG_EFFORT_WEIGHT' },
  { key: 'CAPACITY_WARNING', label: 'Capacity watch threshold', value: 0.85, type: 'number', namedRange: 'CFG_CAPACITY_WARNING' },
  { key: 'CAPACITY_CRITICAL', label: 'Capacity critical threshold', value: 1.2, type: 'number', namedRange: 'CFG_CAPACITY_CRITICAL' },
  { key: 'WEEKLY_HOURS', label: 'Default weekly available hours', value: 10, type: 'number', namedRange: 'CFG_WEEKLY_HOURS' },
  { key: 'TIMEZONE', label: 'Creator timezone', value: 'Etc/GMT', type: 'text', namedRange: 'CFG_TIMEZONE' },
  { key: 'CALENDAR_ID', label: 'Bound calendar id (mirror)', value: '', type: 'text', namedRange: 'CFG_CALENDAR_ID' },
  { key: 'PRIMARY_PLATFORM', label: 'Primary platform', value: 'YouTube', type: 'text', namedRange: 'CFG_PRIMARY_PLATFORM' },
  { key: 'CONTENT_PILLARS', label: 'Content pillars (comma separated)', value: 'Education, Story, Authority', type: 'text', namedRange: 'CFG_CONTENT_PILLARS' },
  { key: 'WORK_DAYS', label: 'Work days (comma separated)', value: 'Mon, Tue, Wed, Thu, Fri', type: 'text', namedRange: 'CFG_WORK_DAYS' },
  { key: 'MAX_AI_RECOMMENDATIONS', label: 'Max AI recommendations per request', value: 5, type: 'number', namedRange: 'CFG_MAX_AI_RECOMMENDATIONS' },
  // Idea → content derivation (correction 4). Objective is mapped from the idea's Strategic Goal;
  // Priority is derived from the idea's computed Priority_Score using these thresholds.
  { key: 'GOAL_OBJECTIVE_MAP', label: 'Idea goal → content objective map', value: 'Awareness:Reach,Engagement:Engage,Authority:Educate,Leads:Convert,Sales:Monetize,Community:Nurture,Retention:Nurture', type: 'text', namedRange: '' },
  { key: 'PRIORITY_CRITICAL_MIN', label: 'Content priority Critical when score >=', value: 3.0, type: 'number', namedRange: '' },
  { key: 'PRIORITY_HIGH_MIN', label: 'Content priority High when score >=', value: 2.0, type: 'number', namedRange: '' },
  { key: 'PRIORITY_MEDIUM_MIN', label: 'Content priority Medium when score >=', value: 1.0, type: 'number', namedRange: '' },
  // Planning: minutes per work day used to spread weekly capacity (PlanningService).
  { key: 'DAILY_START_HOUR', label: 'Work day start hour (0-23)', value: 9, type: 'number', namedRange: '' },
]);

/** Script Properties keys (product-level, immutable). */
const SCRIPT_PROP = Object.freeze({
  PRODUCT_VERSION: 'PRODUCT_VERSION',
  SCHEMA_VERSION: 'SCHEMA_VERSION',
  ID_COUNTER_PREFIX: 'IDSEQ_', // e.g. IDSEQ_TSK
});

/** User Properties keys (per-user, secure — never in cells/logs). */
const USER_PROP = Object.freeze({
  AI_PROVIDER: 'AI_PROVIDER',
  AI_MODEL: 'AI_MODEL',
  AI_API_KEY: 'CREATOROS_AI_API_KEY',
  AI_ENABLED: 'AI_ENABLED',
  CALENDAR_ID: 'CALENDAR_ID',
  REMINDER_ENABLED: 'REMINDER_ENABLED',
  DEFAULT_REMINDER_MINUTES: 'DEFAULT_REMINDER_MINUTES',
  ADVANCED_WORKSPACE: 'ADVANCED_WORKSPACE',
  LAST_EXECUTION_SCORE: 'LAST_EXECUTION_SCORE',
});

/**
 * Editable default model per provider (docs 19 §5 — NOT permanent; the customer may set a
 * custom model in Setup, and these should be updated as providers evolve).
 */
const AI_DEFAULT_MODELS = Object.freeze({
  Anthropic: 'claude-sonnet-4-5',
  OpenAI: 'gpt-4o-mini',
  Gemini: 'gemini-1.5-flash',
  OpenRouter: 'openai/gpt-4o-mini',
});

/** Standard metadata columns present on operational tables (docs 16 §1). */
const META = Object.freeze({ CREATED_AT: 'Created_At', UPDATED_AT: 'Updated_At' });

/**
 * SCHEMA — per-sheet definition consumed by WorkbookService and the repositories.
 *
 * Fields:
 *  - headers:        ordered column headers (row 1)
 *  - kind:           'table' (record store) | 'view' (generated) | 'panel' (layout)
 *  - idColumn:       header holding the immutable id (tables only)
 *  - idPrefix:       ID_PREFIX value for idColumn
 *  - timestamps:     {created, updated} header names auto-stamped by repositories
 *  - formulaColumns: header -> true (owned by a sheet formula; repositories skip on write)
 *  - protect:        'headers' | 'all' — protection strategy for WorkbookService
 *  - validations:    header -> validation spec (enum/number/date/id/url/boolean)
 *  - frozenRows:     number of frozen header rows
 */
const V = {
  enum: (values) => ({ type: 'enum', values }),
  intRange: (min, max) => ({ type: 'number', integer: true, min, max }),
  numMin: (min) => ({ type: 'number', min }),
  date: () => ({ type: 'date' }),
  datetime: () => ({ type: 'datetime' }),
  bool: () => ({ type: 'boolean' }),
  url: () => ({ type: 'url' }),
  id: (prefix) => ({ type: 'id', prefix }),
  jsonIds: (prefix) => ({ type: 'json', itemType: 'id', prefix }),
};

const SCHEMA = Object.freeze({
  [SHEETS.SETUP]: {
    kind: 'table',
    headers: ['Setting_Key', 'Setting_Label', 'Setting_Value', 'Setting_Type', 'Required', 'Validation_Rule', 'Setup_Section', 'Last_Updated'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Setting_Type: V.enum(ENUMS.SETTING_TYPE),
      Required: V.bool(),
      Setup_Section: V.enum(ENUMS.SETUP_SECTION),
    },
  },

  [SHEETS.IDEAS]: {
    kind: 'table',
    idColumn: 'Idea_ID',
    idPrefix: ID_PREFIX.IDEA,
    timestamps: { created: META.CREATED_AT, updated: META.UPDATED_AT },
    headers: ['Idea_ID', 'Created_Date', 'Idea_Title', 'Description', 'Content_Pillar', 'Target_Audience', 'Primary_Platform', 'Suggested_Format', 'Strategic_Goal', 'Effort_Score', 'Impact_Score', 'Confidence_Score', 'Priority_Score', 'Status', 'Source', 'Notes', 'Created_At', 'Updated_At'],
    frozenRows: 1,
    protect: 'headers',
    formulaColumns: { Priority_Score: true }, // D1
    validations: {
      Primary_Platform: V.enum(ENUMS.PLATFORM),
      Suggested_Format: V.enum(ENUMS.FORMAT),
      Strategic_Goal: V.enum(ENUMS.STRATEGIC_GOAL),
      Effort_Score: V.intRange(1, 5),
      Impact_Score: V.intRange(1, 5),
      Confidence_Score: V.intRange(1, 5),
      Status: V.enum(ENUMS.IDEA_STATUS),
      Source: V.enum(ENUMS.IDEA_SOURCE),
    },
  },

  [SHEETS.CONTENT]: {
    kind: 'table',
    idColumn: 'Content_ID',
    idPrefix: ID_PREFIX.CONTENT,
    timestamps: { created: META.CREATED_AT, updated: META.UPDATED_AT },
    // Paused_From_Status persists the status to resume to (pause/resume, ADR-016). Appended at end.
    headers: ['Content_ID', 'Idea_ID', 'Title', 'Content_Pillar', 'Campaign', 'Primary_Platform', 'Format', 'Objective', 'CTA', 'Priority', 'Status', 'Planned_Publish_Date', 'Actual_Publish_Date', 'Estimated_Hours', 'Actual_Hours', 'Source_Content_ID', 'Repurpose_Group_ID', 'Published_URL', 'Owner', 'Notes', 'Created_At', 'Updated_At', 'Paused_From_Status'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Primary_Platform: V.enum(ENUMS.PLATFORM),
      Format: V.enum(ENUMS.FORMAT),
      Objective: V.enum(ENUMS.CONTENT_OBJECTIVE),
      Priority: V.enum(ENUMS.PRIORITY),
      Status: V.enum(ENUMS.CONTENT_STATUS),
      Planned_Publish_Date: V.date(),
      Actual_Publish_Date: V.date(),
      Estimated_Hours: V.numMin(0),
      Actual_Hours: V.numMin(0),
      Published_URL: V.url(),
      Paused_From_Status: V.enum(ENUMS.CONTENT_STATUS),
    },
  },

  [SHEETS.TASKS]: {
    kind: 'table',
    idColumn: 'Task_ID',
    idPrefix: ID_PREFIX.TASK,
    timestamps: { created: META.CREATED_AT, updated: META.UPDATED_AT },
    // Dependency_Task_IDs (JSON array) is the AUTHORITATIVE dependency graph (ADR-011);
    // Dependency_Task_ID keeps the primary/latest predecessor for display/back-compat.
    // Appended at the end so any additive upgrade is column-order-safe.
    headers: ['Task_ID', 'Content_ID', 'Task_Name', 'Task_Type', 'Sequence', 'Dependency_Task_ID', 'Priority', 'Status', 'Estimated_Minutes', 'Scheduled_Start', 'Scheduled_End', 'Due_Date', 'Completed_At', 'Calendar_Event_ID', 'Calendar_Sync_Status', 'Recovery_Status', 'Blocked_Reason', 'Notes', 'Created_At', 'Updated_At', 'Dependency_Task_IDs'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Sequence: V.intRange(1, 999),
      Priority: V.enum(ENUMS.PRIORITY),
      Status: V.enum(ENUMS.TASK_STATUS),
      Estimated_Minutes: V.intRange(5, 1440),
      Calendar_Sync_Status: V.enum(ENUMS.CALENDAR_SYNC),
      Recovery_Status: V.enum(ENUMS.RECOVERY_STATUS),
      Dependency_Task_IDs: V.jsonIds(ID_PREFIX.TASK),
    },
  },

  [SHEETS.WORKFLOWS]: {
    kind: 'table',
    idColumn: 'Step_ID',
    idPrefix: ID_PREFIX.WORKFLOW_STEP,
    headers: ['Workflow_ID', 'Workflow_Name', 'Platform', 'Format', 'Step_ID', 'Task_Sequence', 'Task_Name', 'Task_Type', 'Default_Duration_Minutes', 'Offset_From_Publish_Days', 'Dependency_Sequences', 'Required', 'Active'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Platform: V.enum(ENUMS.PLATFORM),
      Format: V.enum(ENUMS.FORMAT),
      Task_Sequence: V.intRange(1, 999),
      Default_Duration_Minutes: V.intRange(1, 1440),
      Required: V.bool(),
      Active: V.bool(),
    },
  },

  [SHEETS.WEEKLY_PLAN]: {
    kind: 'table',
    idColumn: 'Week_ID',
    idPrefix: ID_PREFIX.WEEK,
    headers: ['Week_ID', 'Week_Start', 'Week_End', 'Available_Minutes', 'Planned_Minutes', 'Utilization_Percent', 'Status', 'Approved_At', 'Warning_Level'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Available_Minutes: V.numMin(0),
      Planned_Minutes: V.numMin(0),
      Status: V.enum(ENUMS.WEEK_STATUS),
      Warning_Level: V.enum(ENUMS.WARNING_LEVEL),
    },
  },

  [SHEETS.REPURPOSING]: {
    kind: 'table',
    idColumn: 'Repurpose_ID',
    idPrefix: ID_PREFIX.REPURPOSE,
    headers: ['Repurpose_ID', 'Source_Content_ID', 'Target_Platform', 'Target_Format', 'Suggested_Angle', 'Status', 'New_Content_ID', 'AI_Generated', 'Created_At'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Target_Platform: V.enum(ENUMS.PLATFORM),
      Target_Format: V.enum(ENUMS.FORMAT),
      AI_Generated: V.bool(),
    },
  },

  [SHEETS.PERFORMANCE]: {
    kind: 'table',
    idColumn: 'Performance_ID',
    idPrefix: ID_PREFIX.PERFORMANCE,
    headers: ['Performance_ID', 'Content_ID', 'Platform', 'Measurement_Date', 'Views', 'Impressions', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'Watch_Time_Minutes', 'Clicks', 'Leads', 'Sales', 'Revenue', 'Notes'],
    frozenRows: 1,
    protect: 'headers',
    validations: {
      Platform: V.enum(ENUMS.PLATFORM),
      Measurement_Date: V.date(),
      Views: V.numMin(0), Impressions: V.numMin(0), Reach: V.numMin(0), Likes: V.numMin(0),
      Comments: V.numMin(0), Shares: V.numMin(0), Saves: V.numMin(0), Watch_Time_Minutes: V.numMin(0),
      Clicks: V.numMin(0), Leads: V.numMin(0), Sales: V.numMin(0), Revenue: V.numMin(0),
    },
  },

  [SHEETS.AI_LOG]: {
    kind: 'table',
    idColumn: 'Request_ID',
    idPrefix: ID_PREFIX.AI_REQUEST,
    headers: ['Request_ID', 'Timestamp', 'User_Action', 'Provider', 'Model', 'Prompt_Type', 'Input_Tokens', 'Output_Tokens', 'Estimated_Cost', 'Status', 'Error_Code', 'Content_ID', 'Notes'],
    frozenRows: 1,
    protect: 'all', // logs are protected (docs 16 §13)
    validations: { Provider: V.enum(ENUMS.AI_PROVIDER) },
  },

  [SHEETS.SYSTEM_LOG]: {
    kind: 'table',
    idColumn: 'Log_ID',
    idPrefix: ID_PREFIX.LOG,
    headers: ['Log_ID', 'Correlation_ID', 'Timestamp', 'Severity', 'Module', 'Function', 'User_Action', 'Record_ID', 'Message', 'Technical_Detail', 'Resolved'],
    frozenRows: 1,
    protect: 'all',
    validations: { Severity: V.enum(ENUMS.SEVERITY), Resolved: V.bool() },
  },

  [SHEETS.RECOVERY_LOG]: {
    kind: 'table',
    idColumn: 'Recovery_Log_ID',
    idPrefix: ID_PREFIX.RECOVERY_LOG,
    headers: ['Recovery_Log_ID', 'Timestamp', 'Task_ID', 'Content_ID', 'Action', 'Reason', 'Previous_Due_Date', 'Previous_Scheduled_Start', 'New_Due_Date', 'New_Scheduled_Start', 'User_Initiated', 'Calendar_Impact', 'Notes'],
    frozenRows: 1,
    protect: 'all', // internal analytics store — not creator-facing (ADR-019)
    validations: { User_Initiated: V.bool() },
  },

  [SHEETS.CONFIG]: {
    kind: 'table',
    headers: ['Config_Key', 'Config_Label', 'Config_Value', 'Config_Type', 'Named_Range', 'Notes'],
    frozenRows: 1,
    protect: 'all', // configuration internals protected
  },

  [SHEETS.CHANGELOG]: {
    kind: 'table',
    headers: ['Version', 'Date', 'Change', 'Impact', 'Migration_Instruction'],
    frozenRows: 1,
    protect: 'all',
  },

  // Generated views — headers only in Milestone 1; populated by later milestones.
  [SHEETS.TODAY]: {
    kind: 'view',
    headers: ['Section', 'Task_ID', 'Task_Name', 'Content_ID', 'Priority', 'Status', 'Due_Date', 'Estimated_Minutes', 'Reason'],
    frozenRows: 1,
    protect: 'all',
  },
  [SHEETS.CALENDAR]: {
    kind: 'view',
    headers: ['Date', 'Type', 'Title', 'Platform', 'Status', 'Task_ID', 'Content_ID', 'Sync_Status'],
    frozenRows: 1,
    protect: 'all',
  },
  [SHEETS.DASHBOARD]: {
    kind: 'view',
    headers: ['Section', 'Metric', 'Value', 'Detail'],
    frozenRows: 1,
    protect: 'all',
  },
  [SHEETS.HOME]: {
    kind: 'panel',
    headers: [],
    frozenRows: 0,
    protect: 'all',
  },
});

/** Ordered list of tabs as they should appear left-to-right. */
const SHEET_ORDER = Object.freeze([
  SHEETS.HOME, SHEETS.SETUP, SHEETS.IDEAS, SHEETS.CONTENT, SHEETS.TASKS,
  SHEETS.WORKFLOWS, SHEETS.WEEKLY_PLAN, SHEETS.TODAY, SHEETS.CALENDAR,
  SHEETS.REPURPOSING, SHEETS.PERFORMANCE, SHEETS.DASHBOARD,
  SHEETS.AI_LOG, SHEETS.SYSTEM_LOG, SHEETS.RECOVERY_LOG, SHEETS.CONFIG, SHEETS.CHANGELOG,
]);

// D4-5 / ADR-019: stamp visibility metadata onto every sheet definition. Metadata only —
// no hiding behavior is implemented yet; a future Creator Mode / Advanced Workspace reads this.
SHEET_ORDER.forEach(function (name) {
  if (SCHEMA[name]) SCHEMA[name].visibility = CREATOR_SHEETS.indexOf(name) !== -1 ? 'creator' : 'system';
});

/** Palette (docs 07, 25): input=blue, formula/lock=gray, header=dark. */
const COLORS = Object.freeze({
  HEADER_BG: '#1f2937',
  HEADER_FG: '#ffffff',
  INPUT_BG: '#eaf2fb',
  FORMULA_BG: '#f0f0f0',
  BRAND: '#2563eb',
  MUTED: '#6b7280',
});

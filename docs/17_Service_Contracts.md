# 17 — Apps Script Service Contracts

## 1. BaseRepository

Responsibilities:

- resolve sheet by name;
- build header map;
- convert rows to records;
- batch create;
- batch update;
- find by ID;
- query by predicates;
- validate required headers.

Public methods:

```javascript
getAll(): Object[]
getById(id: string): Object|null
find(criteria: Object): Object[]
create(record: Object): Object
createMany(records: Object[]): Object[]
updateById(id: string, patch: Object): Object
updateMany(patches: Object[]): Object[]
```

Repositories must not apply domain decisions.

## 2. IdService

```javascript
next(prefix: string): string
reserve(prefix: string, count: number): string[]
validate(id: string, prefix: string): boolean
```

Implementation:

- use LockService;
- store counters in Script Properties;
- never derive from row count;
- never reuse deleted IDs.

## 3. SetupService

```javascript
getSetupState(): SetupState
validateSetup(): ValidationResult
saveSettings(settings: Object): ServiceResult
completeSetup(): ServiceResult
rerunSetup(): ServiceResult
```

Rerunning setup must preserve records.

## 4. IdeaService

```javascript
createIdea(input: IdeaInput): ServiceResult
updateIdea(id: string, patch: Object): ServiceResult
scoreIdea(id: string): ServiceResult
convertToContent(id: string, overrides: Object): ServiceResult
archiveIdea(id: string): ServiceResult
```

Conversion rule:

- only Approved or Reviewed ideas may convert;
- successful conversion changes status to Converted;
- conversion is idempotent unless user explicitly creates another variant.

## 5. ContentService

```javascript
createContent(input: ContentInput): ServiceResult
updateContent(id: string, patch: Object): ServiceResult
selectWorkflow(id: string): WorkflowMatch
changeStatus(id: string, status: string): ServiceResult
markPublished(id: string, publishData: Object): ServiceResult
```

Status transitions:

```text
Backlog → Approved → In Production → Ready → Scheduled → Published
```

Paused and Cancelled can be entered from most nonfinal states.

Invalid transitions return `CONTENT_STATUS_TRANSITION_INVALID`.

## 6. WorkflowService

```javascript
findWorkflow(platform: string, format: string): Workflow|null
getSteps(workflowId: string): WorkflowStep[]
validateWorkflow(workflowId: string): ValidationResult
cloneWorkflow(workflowId: string, name: string): ServiceResult
```

## 7. TaskService

```javascript
generateTasks(contentId: string, workflowId: string, mode: string): ServiceResult
updateTask(id: string, patch: Object): ServiceResult
completeTask(id: string): ServiceResult
blockTask(id: string, reason: string): ServiceResult
getOpenTasks(contentId: string): Task[]
detectOverdue(now: Date): Task[]
```

Generation modes:

- `CREATE_ONLY`
- `APPEND_MISSING`
- `REPLACE_OPEN_TASKS`

The system must never replace completed tasks automatically.

## 8. CapacityService

```javascript
getWeeklyCapacity(weekStart: Date): Capacity
calculateUtilization(tasks: Task[], capacity: Capacity): CapacityResult
findAvailableSlots(tasks: Task[], preferences: WorkPreferences): Slot[]
```

Capacity result:

```javascript
{
  availableMinutes: 480,
  plannedMinutes: 600,
  utilizationPercent: 125,
  warningLevel: "Critical"
}
```

## 9. PlanningService

```javascript
buildWeeklyPlan(weekStart: Date): ServiceResult
approveWeeklyPlan(weekId: string): ServiceResult
rebalanceWeek(weekId: string, strategy: string): ServiceResult
getTodayPlan(date: Date): TodayPlan
```

Planning order:

1. critical overdue;
2. blocking tasks;
3. due tasks;
4. high-priority content;
5. optional tasks.

## 10. CalendarService

```javascript
testConnection(calendarId: string): ServiceResult
pushTasks(taskIds: string[]): ServiceResult
syncTasks(taskIds: string[]): ServiceResult
deleteLinkedEvent(taskId: string): ServiceResult
recreateMissingEvent(taskId: string): ServiceResult
```

Calendar operations require explicit user action except scheduled synchronization if enabled.

## 11. RecoveryService

```javascript
scan(): RecoveryCase[]
analyzeTask(taskId: string): RecoveryAnalysis
applyAction(taskId: string, action: RecoveryAction): ServiceResult
```

Supported actions:

- NEXT_AVAILABLE_SLOT
- MOVE_LOWER_PRIORITY
- REDUCE_SCOPE
- DEFER_CONTENT
- SKIP_TASK
- CANCEL_CONTENT
- MANUAL_RESCHEDULE

## 12. RepurposingService

```javascript
suggestRuleBased(contentId: string): RepurposeSuggestion[]
suggestWithAi(contentId: string): ServiceResult
acceptSuggestion(repurposeId: string): ServiceResult
rejectSuggestion(repurposeId: string): ServiceResult
```

## 13. DashboardService

```javascript
refresh(): ServiceResult
getKpis(filters: DashboardFilters): DashboardKpis
getCharts(filters: DashboardFilters): ChartData
```

Dashboard refresh must not rewrite source data.

## 14. NotificationService

```javascript
enableDailyReminder(config: ReminderConfig): ServiceResult
disableDailyReminder(): ServiceResult
sendDailyReminder(): ServiceResult
sendWeeklyReview(): ServiceResult
```

## 15. AiService

```javascript
testProvider(): ServiceResult
generateWeeklyPlan(context: CreatorContext): ServiceResult
generateIdeas(context: CreatorContext): ServiceResult
generateRepurposing(contentId: string): ServiceResult
analyzePerformance(period: DateRange): ServiceResult
```

AI service must validate structured response before returning it to application services.

## 16. LoggerService

```javascript
info(module: string, message: string, context?: Object): void
warn(module: string, message: string, context?: Object): void
error(module: string, error: Error, context?: Object): void
critical(module: string, error: Error, context?: Object): void
```

Secrets must be sanitized before logging.

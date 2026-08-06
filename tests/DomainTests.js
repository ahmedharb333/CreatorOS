/**
 * DomainTests.gs — Milestone 2 domain-service tests (FR-001, FR-003, FR-004, FR-005).
 *
 * Mutating tests snapshot/restore SETUP and delete any IDEAS/CONTENT/TASKS rows they
 * create, so the workbook is left unchanged. Requires an initialized workbook.
 * @returns {Array<{name:string, fn:Function}>}
 */
function DomainTests_() {
  return [
    // ---- Setup (FR-001) ----
    {
      name: 'SETUP-001 incomplete setup is invalid with missing keys',
      fn: function (t) {
        const repo = new SettingsRepository();
        const snap = snapshotSetup_(repo);
        try {
          SetupService.REQUIRED_KEYS.forEach(function (k) { if (k !== 'TIMEZONE') repo.setValue(k, ''); });
          const v = SetupService.validateSetup();
          t.truthy(!v.valid, 'should be invalid');
          t.truthy(v.missing.indexOf('CREATOR_NAME') !== -1, 'CREATOR_NAME missing');
        } finally { restoreSetup_(repo, snap); }
      },
    },
    {
      name: 'SETUP-002 valid settings save + complete; onboarding Complete',
      fn: function (t) {
        const repo = new SettingsRepository();
        const snap = snapshotSetup_(repo);
        try {
          const res = SetupService.saveSettings({
            CREATOR_NAME: 'Test', BRAND_NAME: 'Test Co', TIMEZONE: 'Etc/GMT', PRIMARY_GOAL: 'Authority',
            PRIMARY_PLATFORM: 'YouTube', WEEKLY_AVAILABLE_HOURS: 10, WORK_DAYS: 'Mon, Tue', CONTENT_PILLARS: 'Education',
          });
          t.truthy(res.success, 'save failed: ' + res.message);
          t.truthy(SetupService.validateSetup().valid, 'should be valid');
          t.truthy(SetupService.completeSetup().success, 'complete failed');
          t.equal(SetupService.getSetupState().onboardingStatus, 'Complete', 'onboarding not Complete');
        } finally { restoreSetup_(repo, snap); }
      },
    },
    {
      name: 'SETUP-003 invalid capacity rejected',
      fn: function (t) {
        const repo = new SettingsRepository();
        const snap = snapshotSetup_(repo);
        try {
          repo.setValue('WEEKLY_AVAILABLE_HOURS', 0);
          t.truthy(!SetupService.validateSetup().valid, 'zero hours should be invalid');
        } finally { restoreSetup_(repo, snap); }
      },
    },

    // ---- Idea (FR-003) ----
    {
      name: 'IDEA-CONV convert derives Objective from goal + Priority from score',
      fn: function (t) {
        // sample: goal Authority (→ Educate), score 4*.5+3*.3-2*.2 = 2.5 (→ High).
        const created = IdeaService.createIdea(sampleIdea_());
        const ideaId = created.data.idea.Idea_ID;
        let contentId = null;
        try {
          IdeaService.updateIdea(ideaId, { Status: 'Approved' });
          const conv = IdeaService.convertToContent(ideaId, {});
          t.truthy(conv.success, 'convert failed: ' + conv.message);
          contentId = conv.data.content.Content_ID;
          t.equal(conv.data.content.Objective, 'Educate', 'objective not derived from Authority');
          t.equal(conv.data.content.Priority, 'High', 'priority not derived from score 2.5');
          t.equal(new IdeaRepository().getById(ideaId).Status, 'Converted', 'idea not Converted');
        } finally {
          if (contentId) new ContentRepository().deleteById(contentId);
          new IdeaRepository().deleteById(ideaId);
        }
      },
    },
    {
      name: 'IDEA-CONFIRM underivable conversion requires confirmation, then supplied values work',
      fn: function (t) {
        // No Strategic_Goal and no scores → Objective and Priority underivable.
        const created = IdeaService.createIdea({
          Created_Date: new Date(), Idea_Title: 'No Goal Idea', Content_Pillar: 'Education',
          Primary_Platform: 'YouTube', Suggested_Format: 'YouTube Long-Form', Status: 'Approved', Source: 'Manual',
        });
        const ideaId = created.data.idea.Idea_ID;
        let contentId = null;
        try {
          const blocked = IdeaService.convertToContent(ideaId, {});
          t.truthy(!blocked.success, 'should require confirmation');
          t.equal(blocked.code, ERR.CONVERSION_NEEDS_CONFIRMATION, 'wrong code: ' + blocked.code);
          const conv = IdeaService.convertToContent(ideaId, { Objective: 'Reach', Priority: 'Low' });
          t.truthy(conv.success, 'supplied values should convert: ' + conv.message);
          contentId = conv.data.content.Content_ID;
          t.equal(conv.data.content.Objective, 'Reach', 'objective override lost');
        } finally {
          if (contentId) new ContentRepository().deleteById(contentId);
          new IdeaRepository().deleteById(ideaId);
        }
      },
    },
    {
      name: 'IDEA-GUARD captured idea cannot convert',
      fn: function (t) {
        const created = IdeaService.createIdea(sampleIdea_());
        const ideaId = created.data.idea.Idea_ID;
        try {
          const conv = IdeaService.convertToContent(ideaId, {});
          t.truthy(!conv.success, 'should reject converting a Captured idea');
          t.equal(conv.code, ERR.CONTENT_STATUS_TRANSITION_INVALID, 'wrong code: ' + conv.code);
        } finally { new IdeaRepository().deleteById(ideaId); }
      },
    },

    // ---- Content (FR-004) ----
    {
      name: 'CNT-TRANS status transition rules (pause/resume excluded)',
      fn: function (t) {
        t.truthy(ContentService._isTransitionAllowed('Backlog', 'Approved'), 'Backlog→Approved allowed');
        t.truthy(!ContentService._isTransitionAllowed('Backlog', 'Published'), 'Backlog→Published blocked');
        t.truthy(ContentService._isTransitionAllowed('Approved', 'In Production'), 'Approved→In Production allowed');
        t.truthy(!ContentService._isTransitionAllowed('Published', 'Approved'), 'Published terminal');
        t.truthy(ContentService._isTransitionAllowed('Approved', 'Cancelled'), 'cancel allowed');
        t.truthy(!ContentService._isTransitionAllowed('Approved', 'Paused'), 'must use pauseContent');
        t.truthy(!ContentService._isTransitionAllowed('Paused', 'In Production'), 'must use resumeContent');
        t.truthy(ContentService._isTransitionAllowed('Paused', 'Cancelled'), 'cancel from Paused allowed');
      },
    },
    {
      name: 'CNT-PAUSE pause stores prior status; resume returns only to it',
      fn: function (t) {
        const c = ContentService.createContent(sampleContent_(null));
        const id = c.data.content.Content_ID;
        try {
          ContentService.changeStatus(id, 'Approved');
          const paused = ContentService.pauseContent(id);
          t.truthy(paused.success, 'pause failed');
          t.equal(paused.data.content.Status, 'Paused', 'not paused');
          t.equal(paused.data.content.Paused_From_Status, 'Approved', 'prior status not stored');
          const bypass = ContentService.changeStatus(id, 'In Production');
          t.truthy(!bypass.success, 'generic transition should not leave Paused');
          const resumed = ContentService.resumeContent(id);
          t.truthy(resumed.success, 'resume failed');
          t.equal(resumed.data.content.Status, 'Approved', 'did not resume to stored status');
          t.truthy(!resumed.data.content.Paused_From_Status, 'Paused_From_Status not cleared');
        } finally { new ContentRepository().deleteById(id); }
      },
    },
    {
      name: 'CNT-PUBDATE scheduling without publish date is rejected',
      fn: function (t) {
        const c = ContentService.createContent(sampleContent_(null));
        const id = c.data.content.Content_ID;
        try {
          ContentService.changeStatus(id, 'Approved');
          ContentService.changeStatus(id, 'In Production');
          ContentService.changeStatus(id, 'Ready');
          const res = ContentService.changeStatus(id, 'Scheduled');
          t.truthy(!res.success, 'should require publish date');
          t.equal(res.code, ERR.CONTENT_PUBLISH_DATE_REQUIRED, 'wrong code: ' + res.code);
        } finally { new ContentRepository().deleteById(id); }
      },
    },

    // ---- Workflow (FR-004) ----
    {
      name: 'WF-VALIDATE default workflow validates and matches',
      fn: function (t) {
        t.truthy(WorkflowService.validateWorkflow('WKF-000001').valid, 'WKF-000001 should validate');
        const m = WorkflowService.findWorkflow('YouTube', 'YouTube Long-Form');
        t.truthy(m && m.workflowId === 'WKF-000001', 'platform/format lookup failed');
      },
    },

    // ---- Task generation (FR-005) ----
    {
      name: 'TASK-GEN 14 tasks, backward dates, authoritative dependency graph',
      fn: function (t) {
        const publish = new Date(2026, 8, 20);
        const c = ContentService.createContent(sampleContent_(publish));
        const contentId = c.data.content.Content_ID;
        try {
          const gen = TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.CREATE_ONLY);
          t.truthy(gen.success, 'generate failed: ' + gen.message);
          t.equal(gen.data.created, 14, 'expected 14 tasks');

          const tasks = new TaskRepository().getByContent(contentId);
          const bySeq = {};
          tasks.forEach(function (x) { bySeq[x.Sequence] = x; });

          t.equal(dayDiff_(bySeq[1].Due_Date, publish), -10, 'research due -10');
          t.equal(dayDiff_(bySeq[11].Due_Date, publish), 0, 'publish due 0');

          // Authoritative full dependency graph: seq9 depends on seq7 AND seq8.
          const deps9 = TaskService.getDependencies(bySeq[9]);
          t.equal(deps9.length, 2, 'seq9 should have 2 dependencies');
          t.truthy(deps9.indexOf(bySeq[7].Task_ID) !== -1, 'seq9 missing seq7 dep');
          t.truthy(deps9.indexOf(bySeq[8].Task_ID) !== -1, 'seq9 missing seq8 dep');
          // Primary pointer = latest predecessor (seq8).
          t.equal(bySeq[9].Dependency_Task_ID, bySeq[8].Task_ID, 'primary should be seq8');

          t.truthy(bySeq[1].Scheduled_Start === '' || bySeq[1].Scheduled_Start == null, 'Scheduled_Start must be empty');

          const again = TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.CREATE_ONLY);
          t.truthy(!again.success && again.code === ERR.TASKS_ALREADY_EXIST, 'second CREATE_ONLY should fail');
        } finally {
          new TaskRepository().getByContent(contentId).forEach(function (x) { new TaskRepository().deleteById(x.Task_ID); });
          new ContentRepository().deleteById(contentId);
        }
      },
    },
    {
      name: 'TASK-DEPS-IMMUTABLE closed task dependencies survive regeneration',
      fn: function (t) {
        const publish = new Date(2026, 8, 20);
        const c = ContentService.createContent(sampleContent_(publish));
        const contentId = c.data.content.Content_ID;
        try {
          TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.CREATE_ONLY);
          let bySeq = indexBySeq_(new TaskRepository().getByContent(contentId));
          const frozen = bySeq[9].Dependency_Task_IDs; // JSON string of old predecessor ids
          TaskService.completeTask(bySeq[9].Task_ID);

          // Regenerate open tasks (new ids for seq 1..8,10..14); completed seq9 preserved.
          const re = TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.REPLACE_OPEN_TASKS);
          t.truthy(re.success, 'replace failed: ' + re.message);
          bySeq = indexBySeq_(new TaskRepository().getByContent(contentId));
          t.equal(bySeq[9].Status, 'Completed', 'seq9 should remain completed');
          t.equal(bySeq[9].Dependency_Task_IDs, frozen, 'closed task deps must not be rewired');
        } finally {
          new TaskRepository().getByContent(contentId).forEach(function (x) { new TaskRepository().deleteById(x.Task_ID); });
          new ContentRepository().deleteById(contentId);
        }
      },
    },
  ];
}

/** @private */
function indexBySeq_(tasks) { const m = {}; tasks.forEach(function (x) { m[x.Sequence] = x; }); return m; }
/** @private */
function snapshotSetup_(repo) {
  const snap = {};
  SetupService.REQUIRED_KEYS.concat(['ONBOARDING_STATUS']).forEach(function (k) { snap[k] = repo.getValue(k); });
  return snap;
}
/** @private */
function restoreSetup_(repo, snap) { Object.keys(snap).forEach(function (k) { repo.setValue(k, snap[k]); }); }
/** @private */
function dayDiff_(a, b) {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}
/** @private */
function sampleIdea_() {
  return {
    Created_Date: new Date(), Idea_Title: 'Domain Test Idea', Content_Pillar: 'Education',
    Primary_Platform: 'YouTube', Suggested_Format: 'YouTube Long-Form', Strategic_Goal: 'Authority',
    Effort_Score: 2, Impact_Score: 4, Confidence_Score: 3, Status: 'Captured', Source: 'Manual',
  };
}
/** @private @param {Date|null} publish */
function sampleContent_(publish) {
  const c = {
    Title: 'Domain Test Content', Content_Pillar: 'Education', Primary_Platform: 'YouTube',
    Format: 'YouTube Long-Form', Objective: 'Reach', Priority: 'High', Status: 'Backlog',
  };
  if (publish) c.Planned_Publish_Date = publish;
  return c;
}

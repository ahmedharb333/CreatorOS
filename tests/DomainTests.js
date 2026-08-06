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
          const v = SetupService.validateSetup();
          t.truthy(v.valid, 'should be valid: ' + JSON.stringify(v));
          const done = SetupService.completeSetup();
          t.truthy(done.success, 'complete failed');
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
          const v = SetupService.validateSetup();
          t.truthy(!v.valid, 'zero hours should be invalid');
        } finally { restoreSetup_(repo, snap); }
      },
    },

    // ---- Idea (FR-003) ----
    {
      name: 'IDEA-CONV convert Approved idea creates content and marks Converted',
      fn: function (t) {
        const created = IdeaService.createIdea(sampleIdea_());
        t.truthy(created.success, 'create idea failed');
        const ideaId = created.data.idea.Idea_ID;
        let contentId = null;
        try {
          IdeaService.updateIdea(ideaId, { Status: 'Approved' });
          const conv = IdeaService.convertToContent(ideaId, { Priority: 'High' });
          t.truthy(conv.success, 'convert failed: ' + conv.message);
          contentId = conv.data.content.Content_ID;
          t.equal(conv.data.content.Idea_ID, ideaId, 'content not linked to idea');
          t.equal(new IdeaRepository().getById(ideaId).Status, 'Converted', 'idea not marked Converted');
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
      name: 'CNT-TRANS status transition rules',
      fn: function (t) {
        t.truthy(ContentService._isTransitionAllowed('Backlog', 'Approved'), 'Backlog→Approved allowed');
        t.truthy(!ContentService._isTransitionAllowed('Backlog', 'Published'), 'Backlog→Published blocked');
        t.truthy(ContentService._isTransitionAllowed('Approved', 'In Production'), 'Approved→In Production allowed');
        t.truthy(!ContentService._isTransitionAllowed('Published', 'Approved'), 'Published terminal');
        t.truthy(ContentService._isTransitionAllowed('Approved', 'Cancelled'), 'cancel from Approved allowed');
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
      name: 'TASK-GEN generates 14 backward-scheduled tasks with dependencies',
      fn: function (t) {
        const publish = new Date(2026, 8, 20); // 20 Sep 2026
        const c = ContentService.createContent(sampleContent_(publish));
        const contentId = c.data.content.Content_ID;
        try {
          const gen = TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.CREATE_ONLY);
          t.truthy(gen.success, 'generate failed: ' + gen.message);
          t.equal(gen.data.created, 14, 'expected 14 tasks');

          const tasks = new TaskRepository().getByContent(contentId);
          const bySeq = {};
          tasks.forEach(function (x) { bySeq[x.Sequence] = x; });

          // Backward due dates: seq1 Research offset -10; seq11 Publish offset 0.
          t.equal(dayDiff_(bySeq[1].Due_Date, publish), -10, 'research due -10');
          t.equal(dayDiff_(bySeq[11].Due_Date, publish), 0, 'publish due 0');

          // Dependency: seq 9 (Final QA) deps 7,8 -> primary 8.
          t.equal(bySeq[9].Dependency_Task_ID, bySeq[8].Task_ID, 'seq9 should depend on seq8');

          // Scheduled times left empty (ADR-015).
          t.truthy(bySeq[1].Scheduled_Start === '' || bySeq[1].Scheduled_Start == null, 'Scheduled_Start must be empty');

          // CREATE_ONLY again is rejected.
          const again = TaskService.generateTasks(contentId, 'WKF-000001', TaskService.MODES.CREATE_ONLY);
          t.truthy(!again.success, 'second CREATE_ONLY should fail');
          t.equal(again.code, ERR.TASKS_ALREADY_EXIST, 'wrong code: ' + again.code);

          // Complete + overdue detection.
          TaskService.completeTask(bySeq[1].Task_ID);
          t.equal(new TaskRepository().getById(bySeq[1].Task_ID).Status, 'Completed', 'not completed');
          const overdue = TaskService.detectOverdue(new Date(2026, 11, 31));
          t.truthy(overdue.some(function (x) { return x.Content_ID === contentId; }), 'overdue not detected');
        } finally {
          new TaskRepository().getByContent(contentId).forEach(function (x) { new TaskRepository().deleteById(x.Task_ID); });
          new ContentRepository().deleteById(contentId);
        }
      },
    },
  ];
}

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

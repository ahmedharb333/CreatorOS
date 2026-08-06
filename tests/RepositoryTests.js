/**
 * RepositoryTests.gs — repository CRUD + formula tests (docs 21 §5, §7).
 *
 * These mutate the workbook, then clean up the rows they create so the workbook
 * is left unchanged. Requires an initialized workbook.
 * @returns {Array<{name:string, fn:Function}>}
 */
function RepositoryTests_() {
  return [
    {
      name: 'REP-001 create idea assigns IDE id + timestamps',
      fn: function (t) {
        const repo = new IdeaRepository();
        const rec = repo.create(validIdea_());
        try {
          t.truthy(/^IDE-\d{6}$/.test(rec.Idea_ID), 'bad idea id: ' + rec.Idea_ID);
          t.truthy(rec.Created_At instanceof Date, 'Created_At not stamped');
          t.truthy(rec.Updated_At instanceof Date, 'Updated_At not stamped');
        } finally {
          TestRunner._deleteById(SHEETS.IDEAS, 'Idea_ID', rec.Idea_ID);
        }
      },
    },
    {
      name: 'REP-002 priority score computed by formula (5,4,2 → 3.3)',
      fn: function (t) {
        const repo = new IdeaRepository();
        const input = validIdea_();
        input.Impact_Score = 5; input.Confidence_Score = 4; input.Effort_Score = 2;
        const rec = repo.create(input);
        try {
          SpreadsheetApp.flush();
          const stored = repo.getById(rec.Idea_ID);
          t.approx(stored.Priority_Score, 3.3, 0.001, 'priority score');
        } finally {
          TestRunner._deleteById(SHEETS.IDEAS, 'Idea_ID', rec.Idea_ID);
        }
      },
    },
    {
      name: 'REP-003 getById and find work by header',
      fn: function (t) {
        const repo = new IdeaRepository();
        const rec = repo.create(validIdea_());
        try {
          const byId = repo.getById(rec.Idea_ID);
          t.truthy(byId, 'getById returned null');
          t.equal(byId.Idea_Title, 'Repo Test Idea', 'title mismatch');
          const found = repo.find({ Idea_ID: rec.Idea_ID });
          t.equal(found.length, 1, 'find count');
        } finally {
          TestRunner._deleteById(SHEETS.IDEAS, 'Idea_ID', rec.Idea_ID);
        }
      },
    },
    {
      name: 'REP-004 updateById changes field, keeps id, bumps Updated_At',
      fn: function (t) {
        const repo = new IdeaRepository();
        const rec = repo.create(validIdea_());
        try {
          Utilities.sleep(5);
          const updated = repo.updateById(rec.Idea_ID, { Status: 'Reviewed' });
          t.equal(updated.Idea_ID, rec.Idea_ID, 'id must be immutable');
          t.equal(updated.Status, 'Reviewed', 'status not updated');
          t.truthy(updated.Updated_At.getTime() >= rec.Updated_At.getTime(), 'Updated_At not advanced');
        } finally {
          TestRunner._deleteById(SHEETS.IDEAS, 'Idea_ID', rec.Idea_ID);
        }
      },
    },
    {
      name: 'REP-005 invalid record rejected with RECORD_VALIDATION_FAILED',
      fn: function (t) {
        const repo = new IdeaRepository();
        t.throwsCode(function () {
          const bad = validIdea_();
          bad.Impact_Score = 99; // out of 1..5
          repo.create(bad);
        }, ERR.RECORD_VALIDATION_FAILED, 'should reject invalid score');
      },
    },
    {
      name: 'REP-006 workflow steps ordered and complete',
      fn: function (t) {
        const repo = new WorkflowRepository();
        const steps = repo.getSteps('WKF-000001');
        t.equal(steps.length, 14, 'YouTube long-form should have 14 steps');
        for (let i = 1; i < steps.length; i++) {
          t.truthy(steps[i].Task_Sequence >= steps[i - 1].Task_Sequence, 'steps not ordered');
        }
        const match = repo.findByPlatformFormat('YouTube', 'YouTube Long-Form');
        t.truthy(match && match.workflowId === 'WKF-000001', 'platform/format lookup failed');
      },
    },
  ];
}

/** @private A valid IDEAS input record for tests. */
function validIdea_() {
  return {
    Created_Date: new Date(),
    Idea_Title: 'Repo Test Idea',
    Description: 'created by automated test',
    Content_Pillar: 'Education',
    Primary_Platform: 'YouTube',
    Suggested_Format: 'YouTube Long-Form',
    Strategic_Goal: 'Authority',
    Effort_Score: 2,
    Impact_Score: 4,
    Confidence_Score: 3,
    Status: 'Captured',
    Source: 'Manual',
    Notes: '',
  };
}

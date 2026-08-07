/**
 * AiTests.gs — AI integration (FR-017/018/019). Executed against injected stub providers
 * and a mock UrlFetchApp — no real network. Verifies: optional/fallback behavior, key
 * safety (never in cells/logs), response validation, error normalization, the approval
 * model (AI writes no records), and that AI consumes analytics via AnalyticsService.
 *
 * Real provider calls require a bound project + customer key (see KNOWN_ISSUES I-07).
 */
function AiTests_() {
  const KEY = 'test-key-shh-123';
  return [
    {
      name: 'AI-001 disabled → weekly plan falls back to rule-based',
      fn: function (t) {
        resetAi_();
        const before = weekCount_();
        const res = AiService.generateWeeklyPlan();
        try {
          t.truthy(res.success, 'fallback should succeed');
          t.equal(res.data.source, 'rule-based', 'should be rule-based when disabled');
        } finally { deleteCurrentWeek_(before); }
      },
    },
    {
      name: 'AI-002 no key → testProvider returns AI_KEY_NOT_CONFIGURED',
      fn: function (t) {
        resetAi_();
        const res = AiService.testProvider();
        t.truthy(!res.success && res.code === ERR.AI_KEY_NOT_CONFIGURED, 'wrong code: ' + res.code);
      },
    },
    {
      name: 'AI-003 HTTP status → normalized AI_* codes',
      fn: function (t) {
        t.equal(AiProvider.httpError(401, '').code, ERR.AI_AUTH_FAILED, '401');
        t.equal(AiProvider.httpError(429, '').code, ERR.AI_RATE_LIMITED, '429');
        t.equal(AiProvider.httpError(404, '').code, ERR.AI_MODEL_NOT_FOUND, '404');
        t.equal(AiProvider.httpError(400, '').code, ERR.AI_INVALID_REQUEST, '400');
        t.equal(AiProvider.httpError(503, '').code, ERR.AI_PROVIDER_UNAVAILABLE, '503');
      },
    },
    {
      name: 'AI-004 enabled + valid JSON → staged plan, NO records written (approval model)',
      fn: function (t) {
        const logIds = aiLogIds_();
        enableStub_(validPlanStub_());
        const c0 = new ContentRepository().getAll().length, k0 = new TaskRepository().getAll().length, w0 = weekCount_();
        try {
          const res = AiService.generateWeeklyPlan();
          t.truthy(res.success && res.data.source === 'ai', 'should use AI: ' + res.message);
          t.truthy(res.data.plan && res.data.plan.summary, 'plan not returned');
          t.equal(new ContentRepository().getAll().length, c0, 'AI must not create content');
          t.equal(new TaskRepository().getAll().length, k0, 'AI must not create tasks');
          t.equal(weekCount_(), w0, 'AI must not write a weekly plan row');
        } finally { resetAi_(); cleanupAiLog_(logIds); }
      },
    },
    {
      name: 'AI-005 malformed JSON → AI_RESPONSE_SCHEMA_INVALID',
      fn: function (t) {
        const logIds = aiLogIds_();
        enableStub_({ complete: function () { return { text: 'not json {', usage: {} }; }, testConnection: function () { return { ok: true }; } });
        try {
          const res = AiService.generateIdeas();
          t.truthy(!res.success && res.code === ERR.AI_RESPONSE_SCHEMA_INVALID, 'wrong code: ' + res.code);
        } finally { resetAi_(); cleanupAiLog_(logIds); }
      },
    },
    {
      name: 'AI-006 provider auth error normalized through to the result',
      fn: function (t) {
        enableStub_({ complete: function () { throw appError(ERR.AI_AUTH_FAILED, { userMessage: 'bad key' }); }, testConnection: function () { return { ok: true }; } });
        try {
          const res = AiService.generateIdeas();
          t.truthy(!res.success && res.code === ERR.AI_AUTH_FAILED, 'wrong code: ' + res.code);
        } finally { resetAi_(); }
      },
    },
    {
      name: 'AI-007 disabled performance analysis uses AnalyticsService (Execution Score)',
      fn: function (t) {
        resetAi_();
        const res = AiService.analyzePerformance();
        t.truthy(res.success && res.data.source === 'rule-based', 'should be rule-based');
        t.truthy(String(res.data.analysis.headline).indexOf('Execution Score') !== -1, 'should reference Execution Score');
      },
    },
    {
      name: 'AI-008 API key never appears in AI_LOG',
      fn: function (t) {
        const logIds = aiLogIds_();
        enableStub_(validPlanStub_());
        try {
          AiService.generateWeeklyPlan(); // logs usage
          const rows = new AiLogRepository().getAll();
          const leaked = rows.some(function (r) { return Object.keys(r).some(function (k) { return String(r[k]).indexOf(KEY) !== -1; }); });
          t.truthy(!leaked, 'API key leaked into AI_LOG');
          t.equal(ConfigService.getUserProp(USER_PROP.AI_API_KEY), KEY, 'key should be in User Properties');
        } finally { resetAi_(); cleanupAiLog_(logIds); }
      },
    },
    {
      name: 'AI-009 Anthropic adapter parses a provider response',
      fn: function (t) {
        // Uses the Node harness HTTP hook to fake a provider response; it is undefined on a
        // real bound project. Skip cleanly there (adapter parsing is exercised via the mock).
        if (typeof globalThis === 'undefined' || typeof globalThis.__mockHttp !== 'function') {
          t.truthy(true, 'skipped: HTTP mock hook not available in this environment');
          return;
        }
        const saved = UrlFetchApp.fetch;
        UrlFetchApp.fetch = function () {
          return globalThis.__mockHttp(200, JSON.stringify({ content: [{ text: '{"ok":true}' }], usage: { input_tokens: 5, output_tokens: 7 } }));
        };
        try {
          const out = new AnthropicProvider('k', 'claude-x').complete('sys', 'user', {});
          t.equal(out.text, '{"ok":true}', 'text not parsed');
          t.equal(out.usage.inputTokens, 5, 'usage not parsed');
        } finally { UrlFetchApp.fetch = saved; }
      },
    },
    {
      name: 'AI-010 disabled repurposing falls back to rule-based mappings',
      fn: function (t) {
        resetAi_();
        const c = ContentService.createContent({ Title: 'AI Rep', Content_Pillar: 'Education', Primary_Platform: 'YouTube', Format: 'YouTube Long-Form', Objective: 'Reach', Priority: 'High', Status: 'Backlog' });
        const cid = c.data.content.Content_ID;
        try {
          const res = AiService.generateRepurposing(cid);
          t.truthy(res.success && res.data.source === 'rule-based', 'should be rule-based when disabled');
        } finally {
          const rr = new RepurposingRepository();
          rr.getBySource(cid).forEach(function (r) { rr.deleteById(r.Repurpose_ID); });
          new ContentRepository().deleteById(cid);
        }
      },
    },
  ];

  // ---- helpers ----
  function validPlanStub_() {
    return {
      complete: function () {
        return {
          text: JSON.stringify({ summary: 'ok', capacity_assessment: { available_minutes: 600, recommended_minutes: 500, status: 'normal' }, content_recommendations: [], task_priorities: [], warnings: [], assumptions: [] }),
          usage: { inputTokens: 10, outputTokens: 20 },
        };
      },
      testConnection: function () { return { ok: true, model: 'stub' }; },
    };
  }
  function enableStub_(stub) {
    AiService.setProvider('Anthropic', KEY);
    AiService.enableAi();
    AiService._setProviderOverride(stub);
  }
  function resetAi_() {
    AiService._setProviderOverride(null);
    ConfigService.setUserProp(USER_PROP.AI_ENABLED, 'false');
    ConfigService.deleteUserProp(USER_PROP.AI_API_KEY);
  }
  function weekCount_() { return new WeeklyPlanRepository().getAll().length; }
  function deleteCurrentWeek_(beforeCount) {
    if (weekCount_() > beforeCount) {
      const b = PlanningService.weekBounds(new Date());
      const wk = new WeeklyPlanRepository().getByWeekStart(b.start);
      if (wk) new WeeklyPlanRepository().deleteById(wk.Week_ID);
    }
  }
  function aiLogIds_() { return new AiLogRepository().getAll().map(function (r) { return r.Request_ID; }); }
  function cleanupAiLog_(beforeIds) {
    const repo = new AiLogRepository();
    repo.getAll().forEach(function (r) { if (beforeIds.indexOf(r.Request_ID) === -1) repo.deleteById(r.Request_ID); });
  }
}

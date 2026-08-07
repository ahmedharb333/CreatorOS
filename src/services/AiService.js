/**
 * AiService.gs — optional, customer-funded AI (FR-017/018/019).
 *
 * AI is optional and the customer supplies the key (User Properties only; never cells/
 * logs). Every AI feature has a rule-based fallback, so CreatorOS works fully with AI
 * disabled. AI consumes analytics ONLY through AnalyticsService (never raw sheets), per
 * the Analytics Contract. Outputs are staged for approval — no records are written by AI.
 *
 * Features are framed around the differentiating selling moments:
 *  - analyzePerformance → "Your Execution Score dropped to X% — here's why."
 *  - explainRecovery    → "Recover without delaying Friday's video."
 *  - generateWeeklyPlan → "This plan is realistic for your actual hours."
 *
 * @see docs/19_AI_Integration_Contracts.md
 * @see docs/Analytics_Contract.md
 */
const AiService = (function () {

  const MODULE = 'AiService';
  const MAX_RETRIES = 2;
  let _override = null; // test seam: inject a stub provider

  // ---- config / key handling ----
  function providerName() { return ConfigService.getUserProp(USER_PROP.AI_PROVIDER); }
  function apiKey() { return ConfigService.getUserProp(USER_PROP.AI_API_KEY); }
  function model() { return ConfigService.getUserProp(USER_PROP.AI_MODEL) || AI_DEFAULT_MODELS[providerName()] || ''; }
  function isEnabled() {
    return ConfigService.getUserProp(USER_PROP.AI_ENABLED) === 'true' && !!apiKey() && !!providerName();
  }

  /**
   * Configure the provider + key + model (key stored in User Properties, never a cell).
   * @param {string} name @param {string} key @param {string} [customModel]
   * @returns {Object} ServiceResult
   */
  function setProvider(name, key, customModel) {
    if (ENUMS.AI_PROVIDER.indexOf(name) === -1) return fail(ERR.AI_INVALID_REQUEST, 'Unknown provider: ' + name);
    ConfigService.setUserProp(USER_PROP.AI_PROVIDER, name);
    if (key) ConfigService.setUserProp(USER_PROP.AI_API_KEY, key);
    ConfigService.setUserProp(USER_PROP.AI_MODEL, customModel || AI_DEFAULT_MODELS[name] || '');
    setSetupStatus('Configured');
    return ok('AI_CONFIGURED', 'AI provider set to ' + name + '. Test the connection to enable AI.', { provider: name, model: model() });
  }

  function enableAi() { ConfigService.setUserProp(USER_PROP.AI_ENABLED, 'true'); return ok('AI_ENABLED_OK', 'AI enabled.'); }
  function disableAi() { ConfigService.setUserProp(USER_PROP.AI_ENABLED, 'false'); return ok('AI_DISABLED_OK', 'AI disabled. Core features continue rule-based.'); }
  /** Remove the stored key (Settings). */
  function clearKey() { ConfigService.deleteUserProp(USER_PROP.AI_API_KEY); ConfigService.setUserProp(USER_PROP.AI_ENABLED, 'false'); setSetupStatus('Not configured'); return ok('AI_KEY_CLEARED', 'AI key removed.'); }

  /** @private mirror a non-secret status into the SETUP sheet. */
  function setSetupStatus(status) { try { new SettingsRepository().setValue('AI_KEY_STATUS', status); } catch (e) { /* setup optional */ } }

  /** @private return the active provider (or injected stub). */
  function getProvider() {
    if (_override) return _override;
    const key = apiKey();
    if (!key) throw appError(ERR.AI_KEY_NOT_CONFIGURED, { severity: SEVERITY.WARNING, userMessage: 'Add your AI API key in Settings to use AI.' });
    return AiProvider.create(providerName(), key, model());
  }

  /**
   * Test the configured provider.
   * @returns {Object} ServiceResult
   */
  function testProvider() {
    try {
      if (!apiKey()) throw appError(ERR.AI_KEY_NOT_CONFIGURED, { severity: SEVERITY.WARNING, userMessage: 'No AI key configured.' });
      const res = getProvider().testConnection();
      ConfigService.setUserProp(USER_PROP.AI_ENABLED, 'true');
      setSetupStatus('Connected');
      logAi('CONNECTION', 'success', null, {});
      return ok('AI_CONNECTED', 'AI connection succeeded.', { model: res.model });
    } catch (err) {
      setSetupStatus('Connection failed');
      logAi('CONNECTION', 'error', err.code, {});
      LoggerService.error(MODULE, err, { fn: 'testProvider' });
      return failFromError(err);
    }
  }

  // ---- context (analytics ONLY via AnalyticsService) ----

  /** @private creator profile + KPIs (metrics come from AnalyticsService, not raw sheets). */
  function creatorContext() {
    const s = SetupService.getSetupState().settings;
    return {
      creator: { name: s.CREATOR_NAME, goal: s.PRIMARY_GOAL, platform: s.PRIMARY_PLATFORM, pillars: s.CONTENT_PILLARS, weeklyHours: s.WEEKLY_AVAILABLE_HOURS },
      kpis: AnalyticsService.getKpis(),
    };
  }

  // ---- generation (staged; no records written; rule-based fallback) ----

  /**
   * Weekly plan suggestion. Selling moment: realistic for the creator's actual hours.
   * @returns {Object} ServiceResult (data.plan staged for approval; data.source)
   */
  function generateWeeklyPlan() {
    if (!isEnabled()) return ruleBasedWeeklyPlan('AI is disabled — showing the rule-based plan.');
    try {
      const ctx = Object.assign({}, creatorContext(), { openTasks: openTaskDigest(), });
      const max = Number(ConfigService.get('MAX_AI_RECOMMENDATIONS', 5));
      const json = callJson('WEEKLY_PLAN', AiPrompts.WEEKLY_PLAN.user(ctx, max),
        ['summary', 'capacity_assessment', 'content_recommendations', 'task_priorities']);
      return ok('AI_WEEKLY_PLAN', 'AI weekly plan ready for review.', { source: 'ai', plan: json });
    } catch (err) {
      LoggerService.warn(MODULE, 'Weekly plan AI failed; falling back', { detail: err.code });
      return ruleBasedWeeklyPlan('AI was unavailable (' + (err.code || 'error') + ') — showing the rule-based plan.');
    }
  }

  /** @private */
  function ruleBasedWeeklyPlan(note) {
    const built = PlanningService.buildWeeklyPlan(now());
    return ok('AI_WEEKLY_PLAN_FALLBACK', note, { source: 'rule-based', plan: built.data, note: note });
  }

  /**
   * Performance analysis. Selling moment: "Execution Score dropped to X% — here's why."
   * @returns {Object} ServiceResult
   */
  function analyzePerformance() {
    const kpis = AnalyticsService.getKpis(); // analytics via AnalyticsService only
    if (!isEnabled()) return ok('AI_PERFORMANCE_FALLBACK', 'Rule-based performance summary.', { source: 'rule-based', analysis: ruleBasedPerformance(kpis) });
    try {
      const json = callJson('PERFORMANCE_ANALYSIS', AiPrompts.PERFORMANCE_ANALYSIS.user({ kpis: kpis }),
        ['headline', 'observations', 'recommendations']);
      return ok('AI_PERFORMANCE', 'AI performance analysis ready.', { source: 'ai', analysis: json });
    } catch (err) {
      return ok('AI_PERFORMANCE_FALLBACK', 'AI unavailable — rule-based summary.', { source: 'rule-based', analysis: ruleBasedPerformance(kpis) });
    }
  }

  /** @private rule-based narrative so the selling moment works without AI. */
  function ruleBasedPerformance(k) {
    const obs = [];
    obs.push('Execution Score is ' + k.executionScore + '% (' + k.executionDetail.completedOnTime + ' of ' + k.executionDetail.plannedDue + ' due tasks completed on time).');
    if (k.overdueCount > 0) obs.push(k.overdueCount + ' task(s) are overdue — run Recovery.');
    obs.push('On-time publishing: ' + k.onTimePublishRate + '%; publishing completion: ' + k.publishingCompletionRate + '%.');
    const recs = [];
    if (k.executionScore < 80) recs.push('Reduce planned load or recover overdue work to lift the Execution Score.');
    if (k.overdueCount > 0) recs.push('Clear overdue tasks first; protect the nearest publish date.');
    return { headline: 'Execution Score: ' + k.executionScore + '%', observations: obs, recommendations: recs.length ? recs : ['Keep the current cadence — commitments are on track.'] };
  }

  /**
   * Recovery explanation. Selling moment: "Recover without delaying Friday's video."
   * @param {string} taskId
   * @returns {Object} ServiceResult
   */
  function explainRecovery(taskId) {
    const analysis = RecoveryService.analyzeTask(taskId);
    const ctx = {
      task: { id: analysis.task.Task_ID, name: analysis.task.Task_Name, priority: analysis.task.Priority, due: analysis.task.Due_Date },
      blocksPublishDate: analysis.blocksPublishDate, dependents: analysis.dependents, recommendedAction: analysis.recommendedAction,
    };
    if (!isEnabled()) return ok('AI_RECOVERY_FALLBACK', 'Rule-based recovery guidance.', { source: 'rule-based', guidance: ruleBasedRecovery(ctx) });
    try {
      const json = callJson('WORKLOAD_ADJUSTMENT', AiPrompts.RECOVERY.user(ctx), ['recommended_action', 'rationale']);
      return ok('AI_RECOVERY', 'AI recovery guidance ready.', { source: 'ai', guidance: json });
    } catch (err) {
      return ok('AI_RECOVERY_FALLBACK', 'AI unavailable — rule-based guidance.', { source: 'rule-based', guidance: ruleBasedRecovery(ctx) });
    }
  }

  /** @private */
  function ruleBasedRecovery(ctx) {
    return {
      headline: 'Recover "' + ctx.task.name + '" while protecting the publish date',
      recommended_action: ctx.recommendedAction,
      protects_publish_date: true,
      rationale: 'Move this task to the next available slot; its ' + ctx.dependents.length + ' dependent task(s) shift with it, keeping the publish date intact. Run Recovery, then Sync Calendar.',
    };
  }

  /**
   * Idea suggestions (staged).
   * @returns {Object} ServiceResult
   */
  function generateIdeas() {
    if (!isEnabled()) return fail(ERR.AI_DISABLED, 'Enable AI to generate ideas, or add ideas manually.');
    try {
      const max = Number(ConfigService.get('MAX_AI_RECOMMENDATIONS', 5));
      const json = callJson('IDEA_GENERATION', AiPrompts.IDEAS.user(creatorContext(), max), ['ideas']);
      return ok('AI_IDEAS', 'AI ideas ready for review.', { source: 'ai', ideas: json.ideas, raw: json });
    } catch (err) { return failFromError(err); }
  }

  /**
   * AI repurposing suggestions; falls back to rule-based mappings.
   * @param {string} contentId
   * @returns {Object} ServiceResult
   */
  function generateRepurposing(contentId) {
    if (!isEnabled()) {
      const rb = RepurposingService.suggestRuleBased(contentId);
      return ok('AI_REPURPOSING_FALLBACK', 'Rule-based repurposing suggestions.', { source: 'rule-based', result: rb.data });
    }
    try {
      const content = new ContentRepository().getById(contentId);
      if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: contentId });
      const json = callJson('REPURPOSING', AiPrompts.REPURPOSING.user({ source: { title: content.Title, platform: content.Primary_Platform, format: content.Format }, enabledPlatforms: ENUMS.PLATFORM }), ['suggestions']);
      return ok('AI_REPURPOSING', 'AI repurposing suggestions ready.', { source: 'ai', suggestions: json.suggestions });
    } catch (err) {
      const rb = RepurposingService.suggestRuleBased(contentId);
      return ok('AI_REPURPOSING_FALLBACK', 'AI unavailable — rule-based suggestions.', { source: 'rule-based', result: rb.data });
    }
  }

  // ---- provider call + validation + logging ----

  /** @private call provider, parse+validate JSON, log usage. Throws normalized AppError. */
  function callJson(promptType, userPrompt, requiredKeys) {
    const provider = getProvider();
    const result = withRetry(function () { return provider.complete(AiPrompts.SYSTEM, userPrompt, { maxTokens: 1500 }); });
    const json = parseJson(result.text);
    validate(json, requiredKeys, promptType);
    logAi(promptType, 'success', null, result.usage);
    return json;
  }

  /** @private retry only rate-limit/transient (docs 19 §12). */
  function withRetry(fn) {
    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try { return fn(); }
      catch (e) {
        lastErr = e;
        const retriable = e instanceof AppError && (e.code === ERR.AI_RATE_LIMITED || e.code === ERR.AI_PROVIDER_UNAVAILABLE || e.code === ERR.AI_NETWORK_ERROR);
        if (!retriable || attempt === MAX_RETRIES) throw e;
        try { Utilities.sleep(300 * Math.pow(2, attempt)); } catch (s) { /* headless */ }
      }
    }
    throw lastErr;
  }

  /** @private strip fences + parse; AI_RESPONSE_SCHEMA_INVALID on failure. */
  function parseJson(text) {
    let t = String(text || '').trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { return JSON.parse(t); }
    catch (e) { throw appError(ERR.AI_RESPONSE_SCHEMA_INVALID, { severity: SEVERITY.WARNING, userMessage: 'The AI response was not valid JSON.', technicalMessage: truncate(t, 200) }); }
  }

  /** @private required-key check. */
  function validate(json, requiredKeys, promptType) {
    if (!json || typeof json !== 'object') throw appError(ERR.AI_RESPONSE_SCHEMA_INVALID, { userMessage: 'The AI response was not an object.' });
    const missing = (requiredKeys || []).filter(function (k) { return json[k] === undefined; });
    if (missing.length) throw appError(ERR.AI_RESPONSE_SCHEMA_INVALID, { userMessage: 'The AI response was missing expected fields.', technicalMessage: promptType + ' missing: ' + missing.join(', ') });
  }

  /** @private write AI usage metadata (no prompt, no key, no response). */
  function logAi(promptType, status, errorCode, usage) {
    try {
      new AiLogRepository().create({
        Timestamp: now(), User_Action: promptType, Provider: providerName() || '', Model: model() || '',
        Prompt_Type: promptType, Input_Tokens: (usage && usage.inputTokens) || 0, Output_Tokens: (usage && usage.outputTokens) || 0,
        Estimated_Cost: '', Status: status, Error_Code: errorCode || '', Content_ID: '', Notes: '',
      });
    } catch (e) { LoggerService.warn(MODULE, 'AI_LOG write failed', { detail: String(e && e.message) }); }
  }

  /** @private minimal open-task digest for planning (operational data, not analytics). */
  function openTaskDigest() {
    return new TaskRepository().getAll()
      .filter(function (t) { return ['Not Started', 'Ready', 'In Progress', 'Blocked'].indexOf(t.Status) !== -1; })
      .slice(0, 40)
      .map(function (t) { return { task_id: t.Task_ID, name: t.Task_Name, priority: t.Priority, due: t.Due_Date }; });
  }

  return {
    // config
    setProvider: setProvider, enableAi: enableAi, disableAi: disableAi, clearKey: clearKey,
    isEnabled: isEnabled, testProvider: testProvider,
    // features
    generateWeeklyPlan: generateWeeklyPlan, analyzePerformance: analyzePerformance,
    explainRecovery: explainRecovery, generateIdeas: generateIdeas, generateRepurposing: generateRepurposing,
    // test seam
    _setProviderOverride: function (p) { _override = p; },
  };
})();

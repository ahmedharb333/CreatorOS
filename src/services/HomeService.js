/**
 * HomeService.gs — the creator HOME console (CX-2/CX-5).
 *
 * HOME answers, at a glance, "what should I do next?" — with the **Execution Score** as
 * the hero metric (the core promise: helping creators execute consistently). Supporting
 * KPIs stay secondary. Before onboarding is complete, HOME shows the guided checklist and
 * the two entry paths. Empty states never leave a blank screen (Empty State Library).
 *
 * `getModel()` returns the data (tested in the mock); `render()` writes it to the HOME sheet.
 */
const HomeService = (function () {

  const MODULE = 'HomeService';

  /** @returns {Object} the HOME view model. */
  function getModel() {
    const kpis = AnalyticsService.getKpis();
    const onboarding = OnboardingService.getState();
    const score = SuccessService.checkExecutionScore();
    const hasData = kpis.contentPlanned > 0 || new TaskRepository().getAll().length > 0;

    return {
      hero: {
        metric: 'Execution Score',
        value: kpis.executionScore + '%',
        why: whyLine(kpis),
        momentum: score.increased ? ('▲ up ' + score.delta + ' pts since last visit') : '',
      },
      status: {
        setup: OnboardingService.getState().complete ? 'Complete' : 'In progress',
        ai: ConfigService.getUserProp(USER_PROP.AI_ENABLED) === 'true' ? 'On' : 'Off (optional)',
        calendar: ConfigService.getUserProp(USER_PROP.CALENDAR_ID) ? 'Connected' : 'Not connected',
        workspace: WorkspaceService.isAdvanced() ? 'Advanced' : 'Creator Mode',
      },
      onboarding: onboarding,
      nextActions: nextActions(onboarding),
      supporting: [
        { label: 'Tasks completed', value: kpis.taskCompletionRate + '%' },
        { label: 'On-time publishing', value: kpis.onTimePublishRate + '%' },
        { label: 'Overdue tasks', value: kpis.overdueCount },
        { label: 'Published', value: kpis.contentPublished },
      ],
      emptyState: hasData ? null : EMPTY_STATES.HOME,
    };
  }

  /** @private one-line "why" for the hero (rule-based; no AI call on render). */
  function whyLine(k) {
    if (k.executionDetail.plannedDue === 0) return 'No planned tasks yet — build a weekly plan to start your score.';
    if (k.overdueCount > 0) return k.overdueCount + ' task(s) overdue. Recovering them lifts your Execution Score.';
    if (k.executionScore >= 80) return 'You are keeping your commitments. Keep the cadence going.';
    return 'A few tasks slipped. Reschedule or reduce scope to get back on track.';
  }

  /** @private next best actions: the onboarding next step, or today's top work. */
  function nextActions(onboarding) {
    if (!onboarding.complete && onboarding.nextStep) {
      return [{ label: onboarding.nextStep.label, action: onboarding.nextStep.action }];
    }
    const today = PlanningService.getTodayPlan(now());
    const top = today.overdue.concat(today.mustDo).slice(0, 3).map(function (t) {
      return { label: t.Task_Name + ' (' + t.Priority + ')', action: 'Open Today' };
    });
    return top.length ? top : [{ label: EMPTY_STATES.TODAY.body, action: EMPTY_STATES.TODAY.action }];
  }

  /**
   * Render the model to the HOME sheet.
   * @returns {Object} ServiceResult
   */
  function render() {
    try {
      const m = getModel();
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HOME);
      // Clear previous content.
      const last = sheet.getLastRow();
      if (last >= 1) sheet.getRange(1, 1, Math.max(last, 40), 3).clearContent();

      const rows = [];
      rows.push(['CreatorOS', '', '']);
      rows.push(['Plan. Execute. Publish. Grow.', '', '']);
      rows.push(['', '', '']);

      if (m.emptyState) {
        rows.push([m.emptyState.title, '', '']);
        rows.push([m.emptyState.body, '', '']);
        rows.push(['→ ' + m.emptyState.action, '', '']);
      } else {
        rows.push(['★ ' + m.hero.metric, m.hero.value, m.hero.momentum]);
        rows.push(['Why', m.hero.why, '']);
        rows.push(['', '', '']);
      }

      if (!m.onboarding.complete) {
        rows.push(['Getting started — ' + m.onboarding.progressPercent + '% complete', '', '']);
        m.onboarding.steps.forEach(function (s) {
          rows.push([(s.done ? '✓ ' : '☐ ') + s.label + (s.optional ? ' (optional)' : ''), s.done ? '' : ('→ ' + s.action), '']);
        });
        rows.push(['', '', '']);
        rows.push(['Try Sample Workspace', 'or', 'Start Empty Workspace']);
      } else {
        rows.push(['What to do next', '', '']);
        m.nextActions.forEach(function (a) { rows.push(['• ' + a.label, '→ ' + a.action, '']); });
      }

      rows.push(['', '', '']);
      rows.push(['Status', '', '']);
      rows.push(['Setup: ' + m.status.setup, 'AI: ' + m.status.ai, '']);
      rows.push(['Calendar: ' + m.status.calendar, 'Workspace: ' + m.status.workspace, '']);
      rows.push(['', '', '']);
      rows.push(['This week', '', '']);
      m.supporting.forEach(function (s) { rows.push([s.label, s.value, '']); });

      sheet.getRange(1, 1, rows.length, 3).setValues(rows);
      sheet.getRange('A1').setFontSize(28).setFontWeight('bold').setFontColor(COLORS.BRAND);
      if (!m.emptyState) sheet.getRange('B4').setFontSize(22).setFontWeight('bold');
      sheet.setColumnWidth(1, 360); sheet.setColumnWidth(2, 260);
      return ok('HOME_RENDERED', 'Home updated.', { model: m });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'render' });
      return failFromError(err);
    }
  }

  return { getModel: getModel, render: render };
})();

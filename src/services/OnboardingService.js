/**
 * OnboardingService.gs — guided first-run onboarding (CX-1).
 *
 * Computes the onboarding checklist + progress from live data (no duplicate state),
 * and offers the two entry paths surfaced on HOME: "Try Sample Workspace" and
 * "Start Empty Workspace". The SETUP sheet remains the authoritative config; a future
 * HTML wizard must call SetupService, not re-validate here.
 */
const OnboardingService = (function () {

  /**
   * @returns {{steps:Array<{key,label,done}>, progressPercent:number, complete:boolean, nextStep:Object|null}}
   */
  function getState() {
    const setupValid = SetupService.validateSetup().valid;
    const ideaCount = new IdeaRepository().getAll().length;
    const contentCount = new ContentRepository().getAll().length;
    const approvedWeek = new WeeklyPlanRepository().getAll().some(function (w) { return w.Status === 'Approved'; });
    const calendar = !!ConfigService.getUserProp(USER_PROP.CALENDAR_ID);
    const aiConfigured = !!ConfigService.getUserProp(USER_PROP.AI_API_KEY);

    const steps = [
      { key: 'setup', label: 'Complete Setup', done: setupValid, action: 'Complete Setup' },
      { key: 'idea', label: 'Capture your first idea', done: ideaCount > 0, action: 'Add Idea' },
      { key: 'content', label: 'Create your first content', done: contentCount > 0, action: 'Create Content' },
      { key: 'plan', label: 'Build & approve a weekly plan', done: approvedWeek, action: 'Build Weekly Plan' },
      { key: 'calendar', label: 'Connect your calendar (optional)', done: calendar, action: 'Connect Calendar', optional: true },
      { key: 'ai', label: 'Set up AI (optional)', done: aiConfigured, action: 'AI: Set Up Provider', optional: true },
    ];
    const core = steps.filter(function (s) { return !s.optional; });
    const coreDone = core.filter(function (s) { return s.done; }).length;
    const done = steps.filter(function (s) { return s.done; }).length;
    const nextStep = steps.find(function (s) { return !s.done; }) || null;
    return {
      steps: steps,
      progressPercent: Math.round((done / steps.length) * 100),
      complete: coreDone === core.length,
      nextStep: nextStep,
    };
  }

  return { getState: getState };
})();

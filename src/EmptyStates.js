/**
 * EmptyStates.gs — the Empty State Library (Creator Experience milestone).
 *
 * Every major creator screen has a designed empty state: a short title + a single clear
 * next action. No screen ever shows an empty table without guidance (Creator Experience
 * Principle: "would they immediately know what to do next?").
 */
const EMPTY_STATES = Object.freeze({
  HOME: { title: 'Welcome to CreatorOS', body: 'Choose "Try Sample Workspace" to explore, or "Start Empty Workspace" to set up your own.', action: 'Try Sample Workspace' },
  IDEAS: { title: 'No ideas yet.', body: 'Capture your first content idea.', action: 'Add Idea' },
  CONTENT: { title: 'No content planned.', body: 'Create your first content item.', action: 'Create Content' },
  TODAY: { title: 'Nothing scheduled today.', body: 'Build your weekly plan to see what to work on.', action: 'Build Weekly Plan' },
  DASHBOARD: { title: 'Complete your first week to unlock insights.', body: 'Publish content and finish tasks — your Execution Score and trends appear here.', action: 'Open Today' },
});

/**
 * Contextual success moments (subtle encouragement). Keyed messages surfaced as toasts.
 */
const SUCCESS_MOMENTS = Object.freeze({
  SETUP_COMPLETE: '✓ Setup complete — CreatorOS can now plan around your real capacity.',
  FIRST_IDEA: '✓ First idea captured.',
  FIRST_CONTENT: '✓ First content created.',
  TASKS_GENERATED: '✓ Production tasks ready.',
  WEEKLY_PLAN: '✓ Weekly plan completed.',
  CALENDAR_SYNCED: '✓ Calendar synchronized.',
  EXECUTION_SCORE_UP: '✓ Execution Score increased — nice momentum.',
  SAMPLE_LOADED: '✓ Sample workspace loaded — explore, then reset any time.',
});

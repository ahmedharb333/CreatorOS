/**
 * WorkflowSeed.gs — default workflow library (docs 27).
 *
 * Loads the 8 built-in workflows into WORKFLOWS through WorkflowRepository, so
 * seeding exercises the same ID assignment and validation as real writes
 * (see RECOMMENDATIONS R-05). Idempotent: does nothing if any workflow exists.
 *
 * Note (ASSUMPTIONS G3): the schema's Dependency_Sequence is single-valued, but the
 * YouTube long-form "Final QA" step logically depends on two predecessors (7 and 8).
 * The seed stores the primary (longest-path) predecessor; multi-dependency is deferred.
 *
 * @see docs/27_Default_Workflow_Library.md
 */
const WorkflowSeed = (function () {

  const MODULE = 'WorkflowSeed';

  /** Each step: [seq, name, type, minutes, offsetDays, required, dep?]. `dep` defaults to seq-1. */
  const LIBRARY = [
    {
      id: 'WKF-000001', name: 'YouTube Long-Form', platform: 'YouTube', format: 'YouTube Long-Form',
      steps: [
        [1, 'Research topic', 'Research', 120, -10, true],
        [2, 'Define angle and promise', 'Strategy', 45, -9, true, 1],
        [3, 'Build outline', 'Writing', 60, -8, true, 2],
        [4, 'Draft script', 'Writing', 180, -7, true, 3],
        [5, 'Review script', 'QA', 60, -6, true, 4],
        [6, 'Record video or voiceover', 'Recording', 120, -5, true, 5],
        [7, 'Edit first cut', 'Editing', 240, -4, true, 6],
        [8, 'Create thumbnail', 'Design', 90, -3, true, 2],
        [9, 'Final QA', 'QA', 60, -2, true, 7],
        [10, 'Upload and metadata', 'Publishing', 60, -1, true, 9],
        [11, 'Publish', 'Publishing', 15, 0, true, 10],
        [12, 'Create repurposing plan', 'Repurposing', 45, 1, false, 11],
        [13, 'Review initial metrics', 'Analytics', 30, 3, true, 11],
        [14, 'Review 7-day performance', 'Analytics', 45, 7, true, 11],
      ],
    },
    {
      id: 'WKF-000002', name: 'YouTube Short', platform: 'YouTube', format: 'YouTube Short',
      steps: [
        [1, 'Select angle', 'Strategy', 20, -3, true],
        [2, 'Draft hook and script', 'Writing', 30, -2, true],
        [3, 'Record', 'Recording', 30, -2, true],
        [4, 'Edit and caption', 'Editing', 60, -1, true],
        [5, 'QA and upload', 'Publishing', 30, -1, true],
        [6, 'Publish', 'Publishing', 10, 0, true],
        [7, 'Review metrics', 'Analytics', 20, 3, true],
      ],
    },
    {
      id: 'WKF-000003', name: 'Instagram Reel', platform: 'Instagram', format: 'Instagram Reel',
      steps: [
        [1, 'Select concept', 'Strategy', 20, -3, true],
        [2, 'Write hook and outline', 'Writing', 25, -2, true],
        [3, 'Record', 'Recording', 30, -2, true],
        [4, 'Edit', 'Editing', 60, -1, true],
        [5, 'Write caption and CTA', 'Writing', 20, -1, true],
        [6, 'Publish', 'Publishing', 10, 0, true],
        [7, 'Community response', 'Engagement', 20, 0, true],
        [8, 'Review metrics', 'Analytics', 20, 3, true],
      ],
    },
    {
      id: 'WKF-000004', name: 'LinkedIn Post', platform: 'LinkedIn', format: 'LinkedIn Post',
      steps: [
        [1, 'Select insight', 'Strategy', 15, -2, true],
        [2, 'Draft post', 'Writing', 35, -1, true],
        [3, 'Edit hook and CTA', 'Writing', 20, -1, true],
        [4, 'Final review', 'QA', 10, 0, true],
        [5, 'Publish', 'Publishing', 10, 0, true],
        [6, 'Respond to comments', 'Engagement', 20, 0, true],
        [7, 'Record metrics', 'Analytics', 10, 2, true],
      ],
    },
    {
      id: 'WKF-000005', name: 'LinkedIn Carousel', platform: 'LinkedIn', format: 'LinkedIn Carousel',
      steps: [
        [1, 'Define lesson', 'Strategy', 20, -5, true],
        [2, 'Build slide outline', 'Writing', 45, -4, true],
        [3, 'Draft slide copy', 'Writing', 60, -3, true],
        [4, 'Design carousel', 'Design', 120, -2, true],
        [5, 'QA and revise', 'QA', 30, -1, true],
        [6, 'Write post caption', 'Writing', 25, -1, true],
        [7, 'Publish', 'Publishing', 10, 0, true],
        [8, 'Review metrics', 'Analytics', 20, 3, true],
      ],
    },
    {
      id: 'WKF-000006', name: 'Newsletter', platform: 'Newsletter', format: 'Newsletter',
      steps: [
        [1, 'Select topic and CTA', 'Strategy', 20, -4, true],
        [2, 'Build outline', 'Writing', 30, -3, true],
        [3, 'Draft newsletter', 'Writing', 90, -2, true],
        [4, 'Edit', 'QA', 40, -1, true],
        [5, 'Format and links QA', 'QA', 30, -1, true],
        [6, 'Send or schedule', 'Publishing', 15, 0, true],
        [7, 'Review open and click results', 'Analytics', 20, 3, true],
      ],
    },
    {
      id: 'WKF-000007', name: 'Podcast Episode', platform: 'Podcast', format: 'Podcast Episode',
      steps: [
        [1, 'Research topic or guest', 'Research', 60, -10, true],
        [2, 'Prepare outline and questions', 'Writing', 60, -7, true],
        [3, 'Record', 'Recording', 120, -5, true],
        [4, 'Edit audio/video', 'Editing', 180, -3, true],
        [5, 'Write title and description', 'Writing', 45, -2, true],
        [6, 'QA', 'QA', 30, -1, true],
        [7, 'Publish', 'Publishing', 20, 0, true],
        [8, 'Create clips', 'Repurposing', 120, 1, false],
        [9, 'Review metrics', 'Analytics', 30, 7, true],
      ],
    },
    {
      id: 'WKF-000008', name: 'Blog Article', platform: 'Blog', format: 'Blog Article',
      steps: [
        [1, 'Research keyword and intent', 'Research', 60, -7, true],
        [2, 'Outline', 'Writing', 45, -6, true],
        [3, 'Draft', 'Writing', 180, -4, true],
        [4, 'Edit and fact-check', 'QA', 90, -2, true],
        [5, 'Format and images', 'Design', 60, -1, true],
        [6, 'Publish', 'Publishing', 20, 0, true],
        [7, 'Repurpose', 'Repurposing', 60, 1, false],
        [8, 'Review performance', 'Analytics', 20, 7, true],
      ],
    },
  ];

  /**
   * Load defaults if none present. Idempotent.
   * @param {boolean} [force] Rebuild even if workflows exist (defaults are restorable, docs 27 §10).
   * @returns {Object} ServiceResult
   */
  function load(force) {
    const repo = new WorkflowRepository();
    if (!force && repo.getAll().length > 0) {
      return ok('WORKFLOWS_PRESENT', 'Workflows already loaded.', { workflows: repo.listWorkflowIds().length });
    }
    const records = [];
    LIBRARY.forEach(function (wf) {
      wf.steps.forEach(function (s) {
        const seq = s[0];
        const dep = s.length > 6 ? s[6] : (seq > 1 ? seq - 1 : '');
        records.push({
          Workflow_ID: wf.id,
          Workflow_Name: wf.name,
          Platform: wf.platform,
          Format: wf.format,
          // Step_ID assigned by repository.
          Task_Sequence: seq,
          Task_Name: s[1],
          Task_Type: s[2],
          Default_Duration_Minutes: s[3],
          Offset_From_Publish_Days: s[4],
          Dependency_Sequence: dep,
          Required: s[5],
          Active: true,
        });
      });
    });
    repo.createMany(records);
    LoggerService.info(MODULE, 'Default workflows loaded', { detail: { workflows: LIBRARY.length, steps: records.length } });
    return ok('WORKFLOWS_LOADED', LIBRARY.length + ' workflows loaded.', { workflows: LIBRARY.length, steps: records.length });
  }

  return { load: load, LIBRARY: LIBRARY };
})();

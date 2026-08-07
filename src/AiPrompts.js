/**
 * AiPrompts.gs — versioned prompt library (docs 28).
 *
 * System prompt enforces the governance rules (no invented data, no guarantees, respect
 * capacity, structured JSON only, no record creation). Selling-moment prompts frame the
 * three differentiating outputs. Prompt changes require a version bump + regression.
 *
 * @see docs/28_AI_Prompt_Library.md
 * @see docs/Analytics_Contract.md
 */
const AiPrompts = Object.freeze({
  VERSION: 'v1.0',

  SYSTEM: [
    'You are CreatorOS, an execution-focused assistant for solo content creators.',
    'Convert the creator\'s goals, capacity, active work, and performance KPIs into practical recommendations.',
    'Rules:',
    '1. Do not invent performance data. Use only the KPIs and context provided.',
    '2. Do not guarantee audience growth, revenue, or virality.',
    '3. Respect the creator\'s available time; label any plan that exceeds capacity.',
    '4. Clearly identify assumptions.',
    '5. Prefer a few executable recommendations over long generic lists.',
    '6. Do not create or modify records; you only propose.',
    '7. Return ONLY valid JSON matching the requested schema — no markdown fences, no prose.',
    '8. Treat overdue and dependency-blocking work as higher priority than optional new content.',
    '9. Use the creator\'s configured platforms and content pillars.',
    '10. Be specific to the supplied context; avoid generic advice.',
  ].join('\n'),

  /** WEEKLY_PLAN — selling moment: "This plan is realistic for your actual hours." */
  WEEKLY_PLAN: {
    id: 'WEEKLY_PLAN', version: 'v1.0',
    schemaHint: '{"summary":"string","capacity_assessment":{"available_minutes":0,"recommended_minutes":0,"status":"normal|watch|overloaded|critical"},"content_recommendations":[{"title":"string","platform":"string","format":"string","pillar":"string","objective":"string","estimated_minutes":0,"rationale":"string"}],"task_priorities":[{"task_id":"string","priority_rank":1,"reason":"string"}],"warnings":["string"],"assumptions":["string"]}',
    user: function (ctx, max) {
      return 'Build a realistic weekly execution recommendation.\n' +
        'Creator + capacity + KPIs:\n' + JSON.stringify(ctx) + '\n' +
        'Constraints: do not exceed available capacity without labeling the overload; protect critical publishing deadlines; ' +
        'recommend no more than ' + max + ' new content items; prioritize recovery and high-impact work.\n' +
        'Return only the JSON schema: ' + this.schemaHint;
    },
  },

  /** PERFORMANCE_ANALYSIS — selling moment: "Your Execution Score dropped to X% — here's why." */
  PERFORMANCE_ANALYSIS: {
    id: 'PERFORMANCE_ANALYSIS', version: 'v1.0',
    schemaHint: '{"headline":"string","observations":["string"],"interpretations":["string"],"recommendations":["string"],"assumptions":["string"]}',
    user: function (ctx) {
      return 'Analyze these execution + performance KPIs and explain, in plain language, what changed and why, ' +
        'then recommend specific changes for the next planning period.\n' +
        'KPIs (from AnalyticsService — do not recompute or invent):\n' + JSON.stringify(ctx) + '\n' +
        'Separate observed facts from interpretation. Do not overstate from small samples.\n' +
        'Return only the JSON schema: ' + this.schemaHint;
    },
  },

  /** RECOVERY — selling moment: "Recover without delaying Friday's video." */
  RECOVERY: {
    id: 'WORKLOAD_ADJUSTMENT', version: 'v1.0',
    schemaHint: '{"headline":"string","recommended_action":"string","alternatives":["string"],"protects_publish_date":true,"rationale":"string","assumptions":["string"]}',
    user: function (ctx) {
      return 'A task is overdue. Recommend how to recover while protecting the content\'s publish date if possible.\n' +
        'Recovery context (task, dependents, publish impact, available options):\n' + JSON.stringify(ctx) + '\n' +
        'Options: move to next slot, move lower-priority work, reduce scope, defer content, skip task, protect critical publication. ' +
        'Do not cancel content automatically.\n' +
        'Return only the JSON schema: ' + this.schemaHint;
    },
  },

  /** IDEA_GENERATION */
  IDEAS: {
    id: 'IDEA_GENERATION', version: 'v1.0',
    schemaHint: '{"ideas":[{"title":"string","angle":"string","platform":"string","format":"string","pillar":"string","objective":"string","estimated_effort":"string","rationale":"string"}],"assumptions":["string"]}',
    user: function (ctx, max) {
      return 'Generate content ideas aligned with the creator\'s pillars, platforms, objective and capacity.\n' +
        'Context + KPIs:\n' + JSON.stringify(ctx) + '\n' +
        'No duplicates of supplied history. Return no more than ' + max + ' ideas.\n' +
        'Return only the JSON schema: ' + this.schemaHint;
    },
  },

  /** REPURPOSING (AI-enhanced; rule-based remains the fallback) */
  REPURPOSING: {
    id: 'REPURPOSING', version: 'v1.0',
    schemaHint: '{"suggestions":[{"target_platform":"string","target_format":"string","angle":"string","hook":"string","estimated_effort":"string","relationship_to_source":"string"}],"assumptions":["string"]}',
    user: function (ctx) {
      return 'Create derivative content recommendations from the supplied source content, using only the creator\'s enabled platforms.\n' +
        'Source + context:\n' + JSON.stringify(ctx) + '\n' +
        'Avoid repeating the source without adaptation. Do not create records.\n' +
        'Return only the JSON schema: ' + this.schemaHint;
    },
  },
});

# 19 — AI Integration Contracts

## 1. Commercial rule

The customer supplies and pays for the AI provider API key.

CreatorOS must never:

- bundle a seller-funded key;
- proxy requests through a seller backend;
- hide expected usage charges;
- expose keys in cells or logs.

## 2. Provider interface

Each provider implements:

```javascript
class AiProvider {
  testConnection() {}
  completeJson(systemPrompt, userPrompt, schema, options) {}
  normalizeUsage(rawResponse) {}
  normalizeError(error) {}
}
```

## 3. Initial providers

- Anthropic
- OpenAI
- Google Gemini
- OpenRouter

Provider-specific code must be isolated.

## 4. Secret storage

Store API key in User Properties:

```text
CREATOROS_AI_API_KEY
```

The Setup sheet may show only:

- Not configured
- Configured
- Connection failed

Never display the key or a partial key.

## 5. Model configuration

The user may:

- select a supported default model;
- enter a custom model identifier;
- test connection;
- disable AI.

Model availability changes over time, so identifiers must not be hardcoded as permanent assumptions.

## 6. Prompt types

- WEEKLY_PLAN
- IDEA_GENERATION
- REPURPOSING
- PERFORMANCE_ANALYSIS
- TITLE_AND_HOOK
- WORKLOAD_ADJUSTMENT

## 7. Context minimization

Send only necessary data.

Exclude:

- full system logs;
- API keys;
- unrelated content history;
- private notes not needed for the action.

## 8. Weekly plan output schema

```json
{
  "summary": "string",
  "capacity_assessment": {
    "available_minutes": 0,
    "recommended_minutes": 0,
    "status": "normal|watch|overloaded|critical"
  },
  "content_recommendations": [
    {
      "title": "string",
      "platform": "string",
      "format": "string",
      "pillar": "string",
      "objective": "string",
      "estimated_minutes": 0,
      "rationale": "string"
    }
  ],
  "task_priorities": [
    {
      "task_id": "string",
      "priority_rank": 1,
      "reason": "string"
    }
  ],
  "repurposing_opportunities": [
    {
      "source_content_id": "string",
      "target_platform": "string",
      "target_format": "string",
      "angle": "string"
    }
  ],
  "warnings": ["string"],
  "assumptions": ["string"]
}
```

## 9. Validation

Before presenting results:

- parse JSON;
- validate required keys;
- reject unknown critical enums;
- ensure task IDs exist;
- ensure estimated minutes are nonnegative;
- ensure AI does not exceed configured maximum recommendations;
- label assumptions.

Invalid responses return `AI_RESPONSE_SCHEMA_INVALID`.

## 10. Approval model

AI output is staged in a review dialog or temporary area.

The user may:

- accept all;
- accept selected;
- edit;
- reject.

No content, task, or calendar record is written before approval.

## 11. Cost logging

Where provider usage is returned, record:

- input tokens;
- output tokens;
- provider;
- model;
- timestamp;
- estimated cost if pricing is configured.

Pricing changes must be user-configurable. Do not hardcode a permanent rate.

## 12. Retry policy

Retry only for:

- rate limit;
- transient server error;
- temporary network error.

Maximum:

- two retries;
- exponential delay;
- no retry for invalid key or invalid request.

## 13. Error normalization

Normalize provider errors into:

- AI_AUTH_FAILED
- AI_RATE_LIMITED
- AI_MODEL_NOT_FOUND
- AI_INVALID_REQUEST
- AI_RESPONSE_SCHEMA_INVALID
- AI_PROVIDER_UNAVAILABLE
- AI_NETWORK_ERROR
- AI_UNKNOWN_ERROR

## 14. Rule-based fallback

If AI is disabled or fails:

- weekly plan still uses priority and capacity rules;
- repurposing still uses workflow mappings;
- task creation still uses templates;
- dashboard still works.

## 15. Prompt governance

System prompts must state:

- do not invent performance data;
- do not claim guaranteed growth;
- use supplied capacity;
- flag missing information;
- return only the requested schema;
- avoid unsafe or unlawful recommendations.

# src/providers — AI provider adapters

The **integration layer** for optional, customer-funded AI (docs 19). Each adapter isolates one provider's
HTTP/request specifics behind a common interface, so `AiService` (in `src/services`) stays
provider-agnostic. **No provider code ships in Milestone 1** — this folder is a placeholder for Milestone 5.

## Common interface (docs 19 §2)

```javascript
class AiProvider {
  testConnection() {}                                   // -> ServiceResult
  completeJson(systemPrompt, userPrompt, schema, options) {} // -> parsed+validated JSON
  normalizeUsage(rawResponse) {}                        // -> {inputTokens, outputTokens}
  normalizeError(error) {}                              // -> one of the AI_* error codes
}
```

## Intended files (Milestone 5)

| File | Provider |
|---|---|
| `AiProvider.js` | Base class / shared contract |
| `AnthropicProvider.js` | Anthropic |
| `OpenAIProvider.js` | OpenAI |
| `GeminiProvider.js` | Google Gemini |
| `OpenRouterProvider.js` | OpenRouter |

## Non-negotiable rules (docs 19, 29)

- **Customer supplies and funds the API key.** Never bundle a seller key; never proxy through a seller backend.
- **Key storage:** User Properties only (`CREATOROS_AI_API_KEY`). Never in cells, source, or logs.
- Adapters may change request syntax but **not** behavioral rules, schemas, the approval requirement,
  context minimization, or logging restrictions.
- Model identifiers are **editable configuration**, never hard-coded as permanent (docs 19 §5, ASSUMPTIONS D2).
- Normalize every provider error into the catalog's `AI_*` codes (docs 20 §9).
- Retry only rate-limit / transient / network errors (max 2, exponential); never retry invalid key/request.

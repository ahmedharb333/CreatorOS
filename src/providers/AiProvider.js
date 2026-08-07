/**
 * AiProvider.gs — provider abstraction for customer-funded AI (docs 19).
 *
 * Each adapter isolates one provider's HTTP shape behind a common interface so AiService
 * stays provider-agnostic. Adapters may change request syntax but NOT behavioral rules,
 * schemas, the approval requirement, context minimization, or logging restrictions.
 *
 *   complete(systemPrompt, userPrompt, options) -> { text, usage:{inputTokens, outputTokens} }
 *   testConnection() -> { ok:true, model }        (throws a normalized AppError on failure)
 *
 * @see docs/19_AI_Integration_Contracts.md
 */
class AiProvider {
  /** @param {string} apiKey @param {string} model */
  constructor(apiKey, model) { this.apiKey = apiKey; this.model = model; }

  /** @abstract */
  complete(systemPrompt, userPrompt, options) { throw appError(ERR.AI_UNKNOWN_ERROR, { technicalMessage: 'complete() not implemented' }); }

  /** Lightweight connectivity check. Adapters may override; default does a tiny completion. */
  testConnection() {
    this.complete('Reply with the JSON {"ok":true}.', 'ping', { maxTokens: 16 });
    return { ok: true, model: this.model };
  }

  /**
   * Map an HTTP status to a normalized AI_* code (docs 20 §9).
   * @param {number} status @param {string} [body]
   * @returns {AppError}
   */
  static httpError(status, body) {
    let code = ERR.AI_UNKNOWN_ERROR;
    if (status === 401 || status === 403) code = ERR.AI_AUTH_FAILED;
    else if (status === 404) code = ERR.AI_MODEL_NOT_FOUND;
    else if (status === 429) code = ERR.AI_RATE_LIMITED;
    else if (status === 400) code = ERR.AI_INVALID_REQUEST;
    else if (status >= 500) code = ERR.AI_PROVIDER_UNAVAILABLE;
    const messages = {};
    messages[ERR.AI_AUTH_FAILED] = 'AI authorization failed. Check your API key.';
    messages[ERR.AI_MODEL_NOT_FOUND] = 'The configured AI model was not found.';
    messages[ERR.AI_RATE_LIMITED] = 'AI provider rate limit reached. Try again shortly.';
    messages[ERR.AI_INVALID_REQUEST] = 'The AI request was rejected as invalid.';
    messages[ERR.AI_PROVIDER_UNAVAILABLE] = 'The AI provider is temporarily unavailable.';
    return appError(code, {
      severity: SEVERITY.WARNING,
      userMessage: messages[code] || 'The AI request could not be completed.',
      technicalMessage: 'HTTP ' + status + ' — ' + truncate(body, 300),
      recoverable: code === ERR.AI_RATE_LIMITED || code === ERR.AI_PROVIDER_UNAVAILABLE,
    });
  }

  /**
   * Factory. Never bundles a seller key — the key is the customer's, from User Properties.
   * @param {string} name one of ENUMS.AI_PROVIDER
   * @param {string} apiKey @param {string} model
   * @returns {AiProvider}
   */
  static create(name, apiKey, model) {
    switch (name) {
      case 'Anthropic': return new AnthropicProvider(apiKey, model);
      case 'OpenAI': return new OpenAIProvider(apiKey, model);
      case 'Gemini': return new GeminiProvider(apiKey, model);
      case 'OpenRouter': return new OpenRouterProvider(apiKey, model);
      default: throw appError(ERR.AI_INVALID_REQUEST, { userMessage: 'Unknown AI provider: ' + name });
    }
  }
}

/** @private shared fetch helper. @returns {{status:number, json:Object, text:string}} */
function aiFetch(url, options) {
  let resp;
  try {
    resp = UrlFetchApp.fetch(url, Object.assign({ muteHttpExceptions: true }, options));
  } catch (e) {
    throw appError(ERR.AI_NETWORK_ERROR, { severity: SEVERITY.WARNING, userMessage: 'Could not reach the AI provider (network error).', technicalMessage: String(e && e.message) });
  }
  const status = resp.getResponseCode();
  const text = resp.getContentText();
  if (status < 200 || status >= 300) throw AiProvider.httpError(status, text);
  let json = {};
  try { json = JSON.parse(text); } catch (e) { json = {}; }
  return { status: status, json: json, text: text };
}

/** @private */
function truncate(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }

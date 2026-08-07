/** OpenRouterProvider.gs — OpenRouter (OpenAI-compatible) adapter (docs 19). */
class OpenRouterProvider extends AiProvider {
  complete(systemPrompt, userPrompt, options) {
    const opts = options || {};
    const res = aiFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + this.apiKey, 'X-Title': 'CreatorOS' },
      payload: JSON.stringify({
        model: this.model,
        max_tokens: opts.maxTokens || 1500,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    });
    const j = res.json;
    const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    const usage = j.usage || {};
    return { text: text, usage: { inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0 } };
  }
}

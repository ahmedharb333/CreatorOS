/** AnthropicProvider.gs — Anthropic Messages API adapter (docs 19). */
class AnthropicProvider extends AiProvider {
  complete(systemPrompt, userPrompt, options) {
    const opts = options || {};
    const res = aiFetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({
        model: this.model,
        max_tokens: opts.maxTokens || 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const j = res.json;
    const text = (j.content && j.content[0] && j.content[0].text) || '';
    const usage = j.usage || {};
    return { text: text, usage: { inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0 } };
  }
}

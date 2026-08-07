/** GeminiProvider.gs — Google Gemini generateContent adapter (docs 19). */
class GeminiProvider extends AiProvider {
  complete(systemPrompt, userPrompt, options) {
    const opts = options || {};
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(this.model) +
      ':generateContent?key=' + encodeURIComponent(this.apiKey);
    const res = aiFetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: opts.maxTokens || 1500, responseMimeType: 'application/json' },
      }),
    });
    const j = res.json;
    const cand = j.candidates && j.candidates[0];
    const text = (cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text) || '';
    const um = j.usageMetadata || {};
    return { text: text, usage: { inputTokens: um.promptTokenCount || 0, outputTokens: um.candidatesTokenCount || 0 } };
  }
}

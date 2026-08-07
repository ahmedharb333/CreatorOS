/**
 * AiLogRepository.gs — data access for the AI_LOG system sheet.
 *
 * Records AI usage metadata only (provider, model, prompt type, token counts, status,
 * error code). Never stores prompts, responses, or API keys (docs 16 §11, 29 §7).
 */
class AiLogRepository extends BaseRepository {
  constructor() { super(SHEETS.AI_LOG); }
}

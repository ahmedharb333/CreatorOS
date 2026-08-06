/** RepurposingRepository.gs — data access for REPURPOSING. */
class RepurposingRepository extends BaseRepository {
  constructor() { super(SHEETS.REPURPOSING); }

  /**
   * Derivative suggestions for a source content item.
   * @param {string} sourceContentId
   * @returns {Object[]}
   */
  getBySource(sourceContentId) {
    return this.find({ Source_Content_ID: sourceContentId });
  }
}

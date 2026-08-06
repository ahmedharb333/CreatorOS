/** TaskRepository.gs — data access for TASKS. */
class TaskRepository extends BaseRepository {
  constructor() { super(SHEETS.TASKS); }

  /**
   * All tasks for a content item, ordered by Sequence.
   * @param {string} contentId
   * @returns {Object[]}
   */
  getByContent(contentId) {
    return this.find({ Content_ID: contentId }).sort(function (a, b) {
      return (a.Sequence || 0) - (b.Sequence || 0);
    });
  }
}

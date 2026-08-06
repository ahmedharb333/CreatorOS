/**
 * IdeaRepository.gs — data access for IDEAS.
 *
 * Owns the Priority_Score formula (D1): a protected per-row sheet formula
 * referencing the CONFIG weight named ranges, so the score recalculates live when
 * component scores change (FR-003) with no script run.
 */
class IdeaRepository extends BaseRepository {
  constructor() { super(SHEETS.IDEAS); }

  /**
   * @override
   * @param {string} header
   * @param {number} rowNumber
   * @returns {string|null}
   */
  formulaFor(header, rowNumber) {
    if (header !== 'Priority_Score') return null;
    const map = this._headers();
    const effort = columnToLetter(map['Effort_Score'] + 1);
    const impact = columnToLetter(map['Impact_Score'] + 1);
    const conf = columnToLetter(map['Confidence_Score'] + 1);
    const r = rowNumber;
    return '=IF(OR($' + effort + r + '="",$' + impact + r + '="",$' + conf + r + '=""),"",' +
      '($' + impact + r + '*CFG_IMPACT_WEIGHT)+($' + conf + r + '*CFG_CONFIDENCE_WEIGHT)-($' + effort + r + '*CFG_EFFORT_WEIGHT))';
  }
}

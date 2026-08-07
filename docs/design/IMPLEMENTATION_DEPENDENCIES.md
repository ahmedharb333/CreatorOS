# CreatorOS — Implementation Dependencies

> The technical requirements created by the approved UX baseline. This is a planning artifact for the
> implementation phase — **not** a build authorization. No code has been written.
> Status: **approved baseline (dependencies catalogued).**

---

## Purpose

The approved UX is larger than "styling the sheet." This document catalogues every technical
requirement it implies, so implementation planning begins from an honest scope. Each item notes its
**phase** (see Implementation Phasing below).

---

## 1. Cockpit infrastructure — *net-new* · Phase 2
A persistent, styled HTML sidebar (`SpreadsheetApp.getUi().showSidebar`) carrying: navigation (that
activates the corresponding sheet), the Coach, quick actions, the Cockpit detail panel, and the AI
proposal-review. This is the single largest build in the spec.
- **Constraint:** Sheets does not guarantee sidebar persistence — the user may close it, and it will
  not always survive navigation. **Design consequence (locked): the Canvas must be fully functional
  with the Cockpit closed.** The Cockpit enhances; it never gates core execution.

## 2. Canvas render rework · Phase 1
Rebuild the presentation layer to the token spec: gridlines off, warm `canvas` background, merged-cell
cards, the spine/gutter column skeleton, tokenized colors, `SPARKLINE`/`REPT` data-viz, tabular
metrics. Affects `HomeService` and `DashboardService`, and requires **new render services** for TODAY,
IDEAS, and CONTENT to their approved layouts.

## 3. `METRICS_SNAPSHOT` table + historical snapshot writer · Phase 1
The DASHBOARD improvement journey must read persisted history, not reconstruct it from current state.
- **New table**, one record per closed reporting period, minimum fields:
  `Period_Start · Period_End · Execution_Score · On_Time_Rate · Consistency · Recovery_Rate ·
  Capacity_Utilization · Created_At`.
- **Snapshot writer:** captures the period's values at week-close (trigger or on-open reconciliation).
- **Note:** `WEEKLY_PLAN` already persists capacity/utilization per week; the remaining metrics are
  net-new. Exact snapshot timing and schema finalized during implementation planning.

## 4. Flywheel demonstration · Phase 3
A bespoke, legible onboarding animation showing `Idea → Content → Plan → Tasks → TODAY → Score` running
(Cockpit motion). High value (the commercial centerpiece + referral trigger); non-trivial build.

## 5. Sample workspace curation · Phase 3
Elevate the sample (`SampleDataService`) to a first-class "movie set": every idea, content piece,
task, metric, recommendation, and recovery example narratively justified as an aspirational preview.
(The sample crash has already been fixed; this is curation, not repair.)

## 6. AI proposal-review component · Phase 2
The dedicated "AI suggestions · you decide" pattern (per-item Keep / Edit / Dismiss; nothing persisted
before approval; commit states exactly what will be created). Reusable across the family.

## 7. Icon system · Phase 1
Adopt a tightly controlled subset of one mature open-source line-icon library (Lucide or equivalent):
SVG in the Cockpit, exported static equivalents for Canvas headers. No proprietary iconography in v1.
Emoji are not functional icons.

## 8. Design tokens · Phase 1
Encode the token architecture (abstract token → Canvas/Cockpit expression) as the single source of
truth so screens introduce no arbitrary colors, spacing, fonts, radii, or shadows.

## 9. Mobile limitations (disclosure, not a build) · all phases
v1 is **desktop-first**. The mobile Google Sheets app does not reliably support HTML modals/sidebar.
- **Mobile = a view-mostly companion:** HOME/TODAY visibility, basic progress, task completion via
  native checkboxes — where technically reliable.
- **Do not promise** rich modals, the full Cockpit, AI Review, or advanced setup on mobile.
- This limitation must be **disclosed in product documentation and marketplace copy.** CreatorOS is
  not described as a mobile application.

## 10. Schema changes (summary)
- **Add:** `METRICS_SNAPSHOT` (item 3).
- **Confirm/extend:** task start timestamp on "Start Task" (TODAY); readiness completeness rules for
  IDEAS sourced from configuration; status-verdict inputs (deadline + progress + movement) available
  to CONTENT.
- No destructive schema changes; all additive and data-preserving.

## 11. Behavioral dependencies (already satisfied or noted)
- **Sample workspace stability** — fixed (delete-all-non-frozen-rows crash resolved).
- **On-Google test suite** — green (76/76) on a bound project.
- **Recommendation logic** (IDEAS "recommended next to build," CONTENT "recommended next," DASHBOARD
  adjustment) reads from existing planning/priority/capacity signals; verify coverage during planning.

---

## Implementation phasing (locked)

Each phase is independently shippable and demoable, with **its own QA gate.**

### Phase 1 — THE SURFACE
*Make CreatorOS stop looking and feeling like a spreadsheet.*
Design tokens · Canvas styling / gridline removal / visual discipline · HOME · TODAY · IDEAS ·
CONTENT · DASHBOARD redesigns · `METRICS_SNAPSHOT` + historical analytics support.

### Phase 2 — THE APP
Cockpit shell · navigation · Coach · contextual actions · sidebar inspection · AI proposal-review
component · the shared HTML interaction system.

### Phase 3 — THE SALE
Curated sample workspace · flywheel demonstration · Impress → Demonstrate → Activate → Ownership
Transfer · "Start My Studio" · the first-five-minute experience.

**No phase is implemented until its implementation is separately opened and approved.**

---

## Open brand items (unresolved — do not embed temporary decisions)

- Parent company name · family/masterbrand lockup · final CreatorOS accent (Visual Brand Review) ·
  flywheel/mechanism name · future toolkit palettes.
- CreatorOS retains indigo-violet `#5B5BD6` as the **temporary approved accent** only.

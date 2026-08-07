# CreatorOS — Creator Experience Milestone Plan (for approval)

**Milestone: Creator Experience (CX)** · Product 1.0.0 · Schema 1 · 2026-08-07
Status: **PLAN — awaiting approval before any UI code** (per the milestone process).

**Objective:** transform CreatorOS from a powerful system into a product that feels effortless — judged by one
question: *"Would a creator immediately understand and value this within the first five minutes?"* No major
backend changes; only small, UX-supporting additions. All work builds on the existing UI-agnostic services and
the `visibility` metadata (ADR-019) — the architecture is already ready for this.

---

## 1. Scope (UX, not new backend capability)

| Priority | Deliverable | Built on |
|---|---|---|
| Simplified navigation | One clean menu (creator actions up top; advanced under a submenu); HOME nav strip | existing menu |
| Creator-focused HOME | A real console: **Execution Score** front-and-center, "what to do next", status chips, primary action buttons | AnalyticsService, PlanningService |
| Progressive disclosure | Show only what a creator needs; advanced behind **Advanced Workspace** | `visibility` metadata |
| Hidden system sheets | Implement the hiding behavior: system sheets hidden in Creator Mode, revealed by Advanced Workspace | ADR-019 metadata |
| Guided onboarding | First-run guided checklist + **"Try with sample data"** 5-minute demo | SetupService, sample loader (R-05) |
| Action-oriented dialogs | HTML dialogs for the top creator actions (Add Idea, Create Content, AI Review) replacing raw prompts | services |
| Overall usability | Consistent messaging, empty states, color/status cues (docs 25) | UiService |

## 2. Build sequence

1. **WorkspaceService** (`services/WorkspaceService.js`) — the only new "backend" piece, minimal and
   UX-driven: `enterCreatorMode()` / `enterAdvancedWorkspace()` hide/show sheets by `SCHEMA[*].visibility`
   (stores a User Prop; applied on `onOpen`). Nothing else changes.
2. **HOME console** — `HomeService.render()` builds the creator console: Execution Score card, setup/AI/calendar
   status, "Next best actions" (from PlanningService.getTodayPlan), and one-click buttons. Rendered to HOME
   (a creator-visible sheet); no raw tables.
3. **Guided onboarding** — `OnboardingService`: a first-run checklist (Setup → first idea → first plan → connect
   calendar → try AI) shown on HOME, and **`loadSampleWorkspace()`** (approve R-05) so a creator sees a working
   dashboard + Execution Score within five minutes, then can reset to a clean workspace.
4. **UiService + dialogs** (`ui/UiService.js`, `ui/*.html`) — HTML Service dialogs for **Add Idea**, **Create
   Content**, and **AI Suggestion Review** (accept selected/edit/reject → writes via existing services, honoring
   the approval model). Other actions keep simple prompts for now.
5. **Menu simplification** — creator actions (Home, Today, Add Idea, Create Content, Weekly Plan, Dashboard)
   at top; Calendar/AI/Recovery/Advanced grouped under a **"More"** submenu; **Advanced Workspace** toggle.
6. **Tests + docs** — mock-executed tests for WorkspaceService (hide/show), HomeService/OnboardingService
   (data correctness), sample loader; dialog server-functions tested at the data level.

## 3. Decisions needing your ruling

- **CX-1 — Onboarding depth:** (a) **guided HOME checklist** + sheet-driven setup + **"Try with sample data"**
  (ships fast, hits the 5-minute goal) — *recommended*; or (b) a full HTML setup **wizard** (richer, more effort,
  can follow). Which for this milestone?
- **CX-2 — Which dialogs now:** build HTML dialogs for **Add Idea, Create Content, AI Review** this milestone
  (highest-value creator moments); keep Record Performance / Recovery as prompts for now. Agree, or a different set?
- **CX-3 — Creator Mode default:** new installs **default to Creator Mode** (system sheets hidden); "Enable
  Advanced Workspace" reveals them. Confirm default-hidden.
- **CX-4 — Sample workspace (R-05):** approve the one-click **`loadSampleWorkspace()`** loader as the core of the
  5-minute demo (writes the sample dataset through the real services; one-click reset)? *Recommended — it's the
  single biggest "I need this" moment.*
- **CX-5 — HOME hero metric:** make **Execution Score** the hero of HOME (big, with a one-line "why"), alongside
  "what to do next". Confirm.

## 4. Backend impact (deliberately minimal)

- **New:** `WorkspaceService` (hide/show sheets), `HomeService`, `OnboardingService`, `UiService` + HTML files,
  `loadSampleWorkspace()`. All consume existing services; **no schema changes, no new external APIs.**
- **Reused:** AnalyticsService (Execution Score + KPIs), PlanningService (Today/next actions), the `visibility`
  metadata, and every domain service (dialogs call them — approval model preserved).
- The `visibility` mock will gain `hideSheet/showSheet` support so hiding is test-covered.

## 5. Test & evidence approach

- **Mock-executed:** WorkspaceService hides exactly the `system` sheets and reveals them; HomeService/
  OnboardingService return correct data (Execution Score, next actions, checklist state); sample loader creates
  a valid, self-consistent workspace and resets cleanly; dialog server-functions produce correct records via
  services (approval model intact).
- **Bound-project (UX):** HTML dialog rendering + the felt "5-minute" flow are inherently visual — captured as
  a short bound-project walkthrough + screenshots at the gate (like the Calendar/AI live evidence), since the
  mock can't render HtmlService.

## 6. Deliverables at the CX gate

New services + dialogs + tests (all green), updated registers (REQUIREMENT_COVERAGE NFR-004 usability, ADR for
Creator Mode activation, CHANGELOG, TEST_RESULTS), a Creator Experience report, and a Release Package — then
stop for QA. No further milestones until approval.

---

**Requested:** approve this plan (with rulings CX-1…CX-5), or adjust. On approval I implement the Creator
Experience, execute all tests + full regression, package it, and stop for QA.

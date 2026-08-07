# CreatorOS — UX Baseline (authoritative index)

> The authoritative index of the approved CreatorOS UX/UI. Reviewed and approved screen-by-screen
> across ten stages. **This is the signed baseline of record.** Implementation is paused; no
> production code has been modified.

---

## Status

- **Baseline:** approved.
- **Scope:** UX/UI specification only. No implementation.
- **Product model:** one-time purchase (not subscription).
- **Governing north-star:** *would a creator who uses Notion / Trello / Google Tasks pay $29 after a
  5-minute demo?*

## The baseline documents

**Foundations**
- [UX_VISION.md](UX_VISION.md) — philosophy, the two-surface model, the universal spine.
- [SALES_PSYCHOLOGY.md](SALES_PSYCHOLOGY.md) — Pain → Purchase → Loyalty; buy the transformation.
- [PORTABLE_CORE.md](PORTABLE_CORE.md) — the reusable product-family language (core vs domain).
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — tokens, theming architecture, motion/voice/data-viz.

**Screens**
- [HOME_SCREEN_SPEC.md](HOME_SCREEN_SPEC.md) — Act screen; stacked *feel → do*.
- [TODAY_SCREEN_SPEC.md](TODAY_SCREEN_SPEC.md) — Act screen; Day Anchor → NOW → UP NEXT → DONE.
- [IDEAS_SCREEN_SPEC.md](IDEAS_SCREEN_SPEC.md) — Collection screen; capture-first.
- [CONTENT_SCREEN_SPEC.md](CONTENT_SCREEN_SPEC.md) — Pipeline screen; status verdicts.
- [DASHBOARD_SCREEN_SPEC.md](DASHBOARD_SCREEN_SPEC.md) — Reflect screen; execution-first, improvement journey.

**Systems**
- [INTERACTION_GUIDELINES.md](INTERACTION_GUIDELINES.md) — four surfaces, motion, feedback, states.
- [FIRST_5_MINUTES.md](FIRST_5_MINUTES.md) — Impress → Demonstrate → Activate → Personalize.
- [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md) — the reusable components.
- [IMPLEMENTATION_DEPENDENCIES.md](IMPLEMENTATION_DEPENDENCIES.md) — technical requirements + phasing.

## Approval log

| Stage | Scope | Decision |
|---|---|---|
| 1 | HOME | Approved — stacked hierarchy, score above action |
| 2 | TODAY | Approved — Day Anchor → NOW → UP NEXT → DONE; integrated recovery |
| 3 | IDEAS | Approved — capture-first; readiness (not quality); recommended next |
| 4 | CONTENT | Approved — Production View; status verdicts; Board/Timeline → v1.1 |
| 5 | DASHBOARD | Approved — execution-first; improvement journey; `METRICS_SNAPSHOT` |
| 6 | Dialogs | Approved — four-surface model; AI Review; desktop-first |
| 7 | Design System | Approved — fixed core + one controlled accent; family theming |
| 8 | First 5 Minutes | Approved — flywheel demonstration; ownership transfer |
| 9 | Sales Psychology | Approved — transformation thesis; Pain → Purchase → Loyalty |
| 10 | Final Review | Approved — consolidation, portable core, phasing |

## The locked Portable Core (one page)

- **Four archetypes:** Act · Collection · Pipeline/Manage · Reflect/Insight.
- **Universal spine:** orient → one operational move → core content → support → dignified problems.
- **Two surfaces:** Canvas (self-sufficient) + Cockpit (enhancement, never a dependency).
- **Four interaction surfaces:** Inline · Cockpit Sidebar · Modal · Confirmation.
- **AI:** proposes, never decides; opt-in; out of the critical onboarding path.
- **Onboarding:** Impress → Demonstrate → Activate → Transfer ownership → Personalize.
- **Voice:** evidence not praise; propose don't judge; orient before reporting; confirm with facts;
  recovery is rerouting; judge process, not people.
- **Tokens:** fixed core + one themeable accent (identity, never meaning).
- **Commerce:** sell the transformation, demonstrate the mechanism, value before effort, trust
  transfers across the family. We own the journey; the outcome is the user's.

## Implementation phasing

1. **The Surface** — tokens, Canvas redesign of all five screens, `METRICS_SNAPSHOT`.
2. **The App** — Cockpit shell, nav, Coach, contextual actions, AI Review.
3. **The Sale** — curated sample, flywheel demonstration, the first-five-minute experience.

Each phase has its own QA gate. No phase begins until separately opened and approved.

## Held flags & open decisions

- **Implementation dependencies:** Cockpit infra, Canvas render rework, `METRICS_SNAPSHOT` + writer,
  flywheel demonstration, sample curation, AI Review, icon system, mobile disclosure — see
  [IMPLEMENTATION_DEPENDENCIES.md](IMPLEMENTATION_DEPENDENCIES.md).
- **v1.1 backlog:** Focus Timer, CONTENT Board/Timeline, exact time-blocking, advanced mobile, richer
  setup wizard, additional dialogs, publishing-milestone events, automatic calendar sync — see
  [../LAUNCH_READINESS.md](../LAUNCH_READINESS.md).
- **Open brand items (unresolved):** parent company name, family/masterbrand lockup, final CreatorOS
  accent (Visual Brand Review), flywheel/mechanism name, future toolkit palettes. CreatorOS retains
  indigo-violet `#5B5BD6` as a temporary approved accent only.

## Next step

Product QA of this baseline. Implementation remains paused until a phase is explicitly opened.

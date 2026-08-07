# CreatorOS — CONTENT Screen Spec

> CONTENT is the production line that manages itself — the middle of the funnel.
> Archetype: **Pipeline / Manage screen.** Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
> Status: **approved baseline.**

---

## Intent

Keep the **publishing pipeline flowing.** Not a project manager — a self-aware production line whose
value is that it **derives status from the underlying tasks and deadlines** (the creator maintains
their work, not a board). The creator should feel: *"My production line is healthy."*

The defining question of this screen: **"What is closest to being published?"** Everything else is
secondary.

**Piece vs task (locked):** CONTENT owns **piece health**; TODAY owns **task execution.** The same
issue never appears in both.

## Hierarchy (Pipeline archetype)

```
   Orient  →  one recommended operational move  →  production pipeline  →  supporting detail
```

## Canvas layout — Production View (gridlines OFF)

```
│   Content                          10 pieces · 1 ships in 3 days · 2 at risk   │  ← orient anchor
│   ▓▓▓▓▓▓░░  Pipeline healthy — one piece needs unblocking.                     │  ← verdict
│                                                                              │
│   RECOMMENDED NEXT                                                            │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  ✓ Ready to Ship — Newsletter #14                Newsletter             │ │  ← one operational move
│   │    Everything required is complete.              [ Mark shipped → ]     │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   IN PRODUCTION (3)                                                           │
│    Quit at Month 3     YouTube · Long   ⚑ At Risk · publishes 3d    ░ 71%  [Open]│  ← status VERDICT leads
│    The 30-day system   YouTube · Long   On Track · ready ~2d        ░ 88%  [Open]│
│    Retention teardown  YouTube · Long   ⚑ Stalled 6 days            ░ 30%  [Unstick]│
│   READY (1) · BACKLOG (4) ▾ · PUBLISHED (6) ▾                                  │  ← attention-ordered, collapsed
```

Only the **Production View** ships in v1. (Board and Timeline lenses are parked to v1.1 — we do not
imitate Kanban unless we can provide a first-class Kanban experience; our differentiation is
operational intelligence, not visual boards.)

## Status verdict (the primary signal)

Each piece leads with an **operational verdict** — the user understands health immediately without
interpreting numbers:

| Verdict | Meaning |
|---|---|
| **Ready to Ship** | Everything required is complete. |
| **On Track** | Progressing on schedule. |
| **At Risk** | Deadline pressure or slowing progress. |
| **Stalled** | No meaningful movement for a while. |

Verdicts are derived from **deadline + progress + recent movement.** Task-completion percentage
becomes **secondary supporting information** (the bar), never the headline.

## Recommended next (operational, never creative)

The recommendation never answers "what is the best content?" It answers **"what action most improves
pipeline flow?"** — e.g., *Ship this · Unblock this · Finish recording · Reschedule publication ·
Continue production.* Operational, always.

## The "Ready to Ship" moment (confidence, not celebration)

When a piece reaches **Ready to Ship**, the screen makes the moment feel significant through
**confidence**, not celebration:

> **Ready to Ship** — Everything required is complete. Publish when you're ready.

This reinforces the product promise: **CreatorOS removes uncertainty.**

## Recovery (integrated)

At-risk and stalled pieces appear **naturally in the production flow** with a quiet marker and a
reroute action (Unstick / Reschedule publish). Never a headline failure band. The creator feels
supported, not judged.

## Content detail **[Cockpit]**

Opening a piece slides a **detail panel** into the Cockpit: status, its workflow task checklist,
publish date, dependencies, quick adjustments, contextual Coach guidance. The Canvas stays visible.
**CONTENT remains usable with the Cockpit closed** (the Production View is self-sufficient).

## States

- **Empty:** *"No content is currently in production. Turn your first idea into content."* +
  [ Build from Ideas ]. Never an empty production table.
- **Bottleneck detected:** if In Production is overloaded vs. Published, the Coach names it and offers
  to focus and ship one — visible column becomes coaching.
- **Big backlog:** Backlog and Published stay collapsed; the creator is never confronted with a wall
  of not-started or archived work.

## Anti-patterns

- ❌ A flat table sorted by ID/date with status as enum text.
- ❌ Percentage as the headline (verdict leads; % supports).
- ❌ A top "Needs Attention" failure band.
- ❌ Imitating Kanban we can't deliver first-class (Board/Timeline are v1.1).

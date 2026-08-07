# CreatorOS — IDEAS Screen Spec

> IDEAS is the top of the pipeline — a creative capture space, not a gallery or a project board.
> Archetype: **Collection screen.** Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Status: **approved baseline.**

---

## Intent

Keep the top of the pipeline full and flowing. Three jobs, in order:

1. **Never lose a spark** (capture-first).
2. **Help shape it when needed.**
3. **Move a ready idea into execution.**

The creator should feel *creative abundance and momentum* — never a backlog of undeveloped debt.

## Hierarchy (Collection archetype)

```
   Capture  →  orient  →  advance one idea  →  browse  →  park (without guilt)
```

## Canvas layout (capture-first — gridlines OFF)

```
│   Ideas                                          12 sparks · 3 ready to build  │  h1 + orient
│   Capture anything — shape it later.                                          │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  ✎  Spark an idea…                                          [ Add ]      │ │  ← the HERO: capture
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   Recommended next to build: "Why creators quit at Month 3"  [ Turn into Content → ]  ← one operational move
│                                                                              │
│   READY TO BUILD (3)                                                          │
│    ✦ Why creators quit at Month 3     Story · YouTube            [ Build → ]   │
│    ✦ The 30-day publishing system     Authority · YouTube        [ Build → ]   │
│   RECENT SPARKS (6)                                                            │
│    · Weekly creator digest            Newsletter · needs an angle [ Develop ]  │
│    · 3 editing mistakes               Short                       [ Develop ]  │
│   PARKED (5) ▾                                          ✦ Ask AI: what to build next │
```

Groups: **READY TO BUILD / RECENT SPARKS / PARKED** (collapsed by default). A prolific creator should
scan 30–50 ideas without the page becoming exhausting.

## Capture (the hero interaction)

- The persistent **one-field** capture input is the hero of the screen (mirrored in the Cockpit).
- **Minimum capture requirement: the idea title only.** Nothing else may block capture.
- After saving, the creator may optionally add pillar, platform, format, objective, description,
  notes, effort/impact/confidence — but none of these are required.
- Preserve the feeling: **"I thought of it → it is safe."** Confirmation is evidence-based:
  *"Captured. Your first idea is now part of your workflow."*

## Readiness signal (process, never quality)

Every idea carries a **readiness** signal answering only: *"Is there enough information to move this
into production?"* — never quality, likelihood of success, or creative potential.

| State | Meaning |
|---|---|
| **JUST A SPARK** | Enough to save, not enough to confidently start production. |
| **SHAPED** | Useful context present, but still needs one or more production decisions. |
| **READY TO BUILD** | The minimum required production inputs are present; can convert to Content. |

Readiness is derived from **explicit completeness rules from configuration** (e.g., READY TO BUILD
may require title + platform + format + pillar + objective) — not subjective scoring. **Never** use
stars, promise/quality scores, "weak/bad idea," or unsolicited AI judgment.

> Portable Core principle: *the system may evaluate process readiness; it must not pass unsolicited
> judgment on the user's judgment.*

## Recommended next to build (the one move)

- Surface **"Recommended next to build"** — never "your best idea" (which would imply CreatorOS knows
  creative quality). The recommendation is based on **objective operational inputs**: readiness,
  creator-set priority, strategic goal, capacity, deadline/campaign relevance, existing workload.
- If no defensible recommendation exists: *"Choose a ready idea to build next."*
- The primary action, **Turn into Content**, is the commercial transition moment
  (`Idea → Content → Workflow → Tasks → TODAY`). Make it fast and consequential.

## Density (two card types)

- **Spark row:** title · readiness · optional pillar · one contextual action.
- **Developed idea:** title · angle/description · pillar · platform/format · readiness · relevant
  action.

Never give a one-line idea a giant empty card.

## AI (opt-in, advisory)

Approved, opt-in: **Develop this idea · Suggest an angle · What should I build next? · Generate ideas
from my pillars.** AI is **proposer, not decider** — it must not automatically rewrite, rank, reject,
or convert ideas. Any AI opinion is clearly advisory and approval-staged.

## States

- **Empty:** inviting, not empty infrastructure — *"Every piece of content starts as a spark."* +
  the capture field + [ Add ]; optional secondary [ Generate ideas with AI ].
- **Idea-rich:** grouping + collapsed PARKED keeps it calm; the creator feels abundant, not buried.
- **All parked / stale:** the Coach gently offers AI ranking (opt-in).

## Anti-patterns

- ❌ A table with Title/Pillar/Score/Status columns.
- ❌ Any quality/promise rating of the idea itself.
- ❌ Requiring pillar/platform/format at capture.
- ❌ Deleting rejected ideas outright — park, don't destroy.

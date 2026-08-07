# CreatorOS — DASHBOARD Screen Spec

> DASHBOARD proves the system is working and the creator is improving — over time.
> Archetype: **Reflect / Insight screen.** Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
> Source of numbers: AnalyticsService + the `METRICS_SNAPSHOT` history (see
> [IMPLEMENTATION_DEPENDENCIES.md](IMPLEMENTATION_DEPENDENCIES.md)). Status: **approved baseline.**

---

## Intent

DASHBOARD answers **"Am I executing reliably, am I consistent, and am I improving?"** Its job is to
**prove continued value, reinforce progress, build trust, and increase long-term usage** — creating
testimonial/referral potential and strengthening future toolkit purchases. Its emotional register is
**earned confidence via evidence, never praise.** *("Here is the evidence,"* not *"we think you're
amazing.")*

Distinct from HOME: HOME shows the **current** score for orientation; DASHBOARD shows the score
**over time** and the story behind it.

## Hierarchy (Reflect archetype)

```
   Orient with evidence  →  recommend one adjustment (when justified)  →
   improvement in what you control (leading)  →  outcomes (secondary)  →  thin-data grace
```

## Canvas layout (gridlines OFF)

```
│   Dashboard · Last 6 weeks                                        ◷ updated 9m │
│   You've published on time for 6 consecutive weeks.                            │  ← deterministic verdict (evidence)
│                                                                              │
│   RECOMMENDED                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  Next week is 18% over capacity.                  [ Lighten next week ] │ │  ← lighter-touch adjustment
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   YOUR EXECUTION · what you control                                           │
│   EXECUTION SCORE  82  ▲ +14        The journey · 6 weeks                       │
│                                      68 → 72 → 75 → 79 → 82  climbing           │  ← the improvement CENTERPIECE
│   On-time 100% ▓▓▓▓▓▓▓▓▓▓  ·  Consistency 🔥 6 wks (best)  ·  Recovery 3 of 3    │
│                                                                              │
│   HOW IT'S LANDING · outcomes (secondary, smaller)                            │
│   Avg views 5.2k ▁▂▄▆ ▲   ·   Engagement 3.4% ▂▃▃▅ ▲   ·   Best: 30-day · 12k   │
```

## Section spec

### Verdict headline **[Canvas]**
A **deterministic, rule-derived** sentence, always supported by actual data:
- *"You've published on time for 6 consecutive weeks."*
- *"Your Execution Score improved 14 points over the last 6 weeks."*
- *"Recovery protected 3 publishing deadlines this month."*

Never generic ("You're crushing it!"). The base dashboard **must never depend on an AI request**; AI
provides an optional *Explain this / Go deeper*.

### Recommended adjustment **[Canvas]**
Lighter-touch than TODAY/CONTENT — *reflect → understand → adjust.* Examples: *"Next week is 18% over
capacity" → [Lighten next week]*; *"Two pieces repeatedly stall during editing" → [Review production
workflow]*. If there is **no defensible adjustment, do not manufacture one** — use a confidence
statement instead (*"You've executed consistently for six weeks."*).

### YOUR EXECUTION — what you control (leads, dominant) **[Canvas]**
The hard-hierarchy top tier. A weak reach week must never visually overpower strong execution.
- **Execution Score + the improvement journey** as the emotional centerpiece — show the series
  (`68 → 72 → 75 → 79 → 82`) with direction obvious, not just the current number. The creator should
  see *"I am becoming more consistent."*
- Primary metrics only: **Execution Score · On-time publishing · Consistency / streak · Recovery
  effectiveness.** Raw task counts stay at TODAY/operational altitude.

### HOW IT'S LANDING — outcomes (secondary, smaller) **[Canvas]**
Clearly separated and visually smaller: views/reach, engagement, best-performing published content,
leads/sales where configured. Outcomes provide **learning, not judgment**.

## Emotional register

Communicate *"here is the evidence,"* never *"we think you're amazing."* This is essential to the
trustworthy character of the product and of the family.

## States

- **Thin data (first-class):** never empty charts. *"Your progress story is just beginning."* /
  *"Week 1 complete — keep executing and CreatorOS will show your trend here."* / *"2 publishing
  cycles tracked."* Show whatever meaningful data exists and explain what becomes available next.
- **Strong period:** the verdict affirms via evidence; a milestone may trigger a rationed Moment.
- **Rough period:** the verdict stays supportive and specific; the recommended adjustment leads with
  the single highest-leverage lever. Never a wall of red.

## Historical dependency

The improvement journey **reads from persisted `METRICS_SNAPSHOT` history** (one record per closed
period), never from reconstructing historical values from current state. See
[IMPLEMENTATION_DEPENDENCIES.md](IMPLEMENTATION_DEPENDENCIES.md).

## Anti-patterns

- ❌ A raw table of metrics and dates.
- ❌ Mixing execution and reach at equal weight (execution leads; reach is secondary).
- ❌ Vanity metrics leading, or a soft reach week overpowering strong execution.
- ❌ Numbers without an interpretation verdict.
- ❌ An AI-dependent base dashboard, or manufactured recommendations.

# CreatorOS — HOME Screen Spec

> HOME is the 5-second test — the screen that decides "spreadsheet" vs "studio."
> Archetype: **Act screen.** Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Status: **approved baseline.**

---

## Intent

HOME is a **morning briefing and launchpad** — orientation at the *workspace* level. It answers, in
order: **"How am I doing overall?" → "What matters most?" → "Do it."** It is not a report, an editor,
or a dashboard, and it must never drift into one.

Distinct from TODAY: HOME is workspace-level orientation you pass through; TODAY is day-level
execution you inhabit. They may reference the same highest-priority task but must never feel like
duplicate screens.

## Emotional sequence (locked, Portable Core)

```
   "How am I doing?"  →  "What matters now?"  →  "Do it."
      Execution Score       Today's One Thing      primary action
```

The score provides orientation and reassurance first; the action converts that clarity into
movement. **Score above action** — always.

## Canvas layout (stacked hierarchy — gridlines OFF)

```
│                                                                              │  ← spine
│   Good morning, Alex.                                     Mon · Aug 10        │  h1 greeting + date
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  EXECUTION SCORE                                                        │ │  ← the anchor (feel)
│   │     82   ▲ +6   ▓▓▓▓▓▓▓▓▓░  Strong                                       │ │
│   │  You're publishing 100% on time — keep the thread.                     │ │  ← the ONE authoritative verdict
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   TODAY'S ONE THING                                                           │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  ▶  Write the hook — Quit at Month 3            ~15 min · due today      │ │  ← the primary move (do)
│   │     [ Start ]                                   Next: 2 more ▾           │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ⚑ Needs you: 2 slipped [ Reschedule ]   ·   Next publish: Quit @M3 · 3d ░  │  ← conditional tertiary line
│                                                                              │
```

Warm `canvas`; cards are `surface` lifted by contrast; separated by whitespace — no gridlines, no
loud borders.

## Section spec

### Greeting **[Canvas]**
`Good {morning|afternoon|evening}, {FirstName}.` (`h1`, time-aware, name-driven) + date (`meta`).

### Execution Score anchor **[Canvas]**
- The emotional anchor and orientation beat. `display` (34pt), tabular, colored by health band, with
  **trend** (`▲ +6`) and a **health bar** + one-word band (`Needs work · Building · Good · Strong`).
- The score band carries **the one authoritative verdict** — a single Coach-written sentence
  interpreting status. This is the *only* interpretation voice on the Canvas; the Cockpit Coach may
  elaborate or execute but must not contradict or duplicate this wording.
- HOME shows the **current** score (orientation for action). The score *over time* is DASHBOARD's job.

### Today's One Thing **[Canvas]**
- **Exactly one** task — the current highest-priority executable task from the planning/dependency
  logic — as the primary line (`▶`, verb-first, `~Xmin · due today`). The loudest content on screen.
- Primary action: **Start** (updates the task to In Progress, optionally timestamps the start).
  Secondary: `Next: N more ▾` reveals the following items without leaving HOME.
- If no task is available, render a **deliberate empty state**, never an empty card ("You're clear
  for today — want to get ahead?").

### Conditional tertiary line **[Canvas]**
- Sparse and conditional only. At most: **slipped work** ("Needs you: 2 slipped · Reschedule") and
  **nearest publish** ("Next publish: … · in 3d"). Nothing else. Omit when empty.
- Recovery here is integrated and dignified (rerouting), never a headline failure band.

### Cockpit on HOME **[Cockpit]**
Persistent nav · the **Coach** (elaborates on the verdict, offers encouragement, owns the action
button) · **Quick Actions** (+ Idea, + Content, Build my week). The Canvas states the move; the
Cockpit lets you act on it. **HOME remains fully usable with the Cockpit closed.**

## States

- **Zero / fresh install:** greeting + a value-first handoff ("Your studio's ready — see it come
  alive") into the sample / first-five-minutes flow. **Never** empty KPI blocks or a score of 0.
- **Behind / recovery:** verdict and Coach shift to supportive-recovery tone; the tertiary "Needs
  you" line appears; the primary action can become "Reschedule what slipped." No red screens, no shame.
- **All clear:** verdict affirms via evidence; Today's One Thing offers a "get ahead" option.

## Anti-patterns

- ❌ A table of tasks (Today's One Thing is one line + a reveal).
- ❌ More than one primary action, or a metric row (metrics belong on DASHBOARD).
- ❌ Two interpretation voices — the score band is authoritative.
- ❌ Rendering zeros or empty KPI blocks at zero state.
- ❌ Drifting into a reporting dashboard.

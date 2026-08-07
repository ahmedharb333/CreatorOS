# CreatorOS — TODAY Screen Spec

> TODAY is the focused execution surface — a work session, not a task table.
> Archetype: **Act screen.** Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Status: **approved baseline.**

---

## Intent

TODAY is execution at the *day* level. It answers **"How is today going?" → "What do I do now?"** It
is the surface a creator *stays in* to work through the day in flow, defeating procrastination (tiny,
startable next actions) and sustaining momentum (visible, rewarded progress).

Distinct from HOME (workspace orientation) and from CONTENT: **TODAY owns task execution; CONTENT
owns piece health.** The same issue never appears twice in two different ways.

## Layout: Day Anchor → NOW → UP NEXT → DONE

```
│   Today · Monday                              2 of 5 done · ~45 min left      │  ← DAY ANCHOR (orient)
│   ▓▓▓▓░░░░  On track — keep the thread.                                        │
│                                                                              │
│   NOW                                                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  ▶  Write the hook — Quit at Month 3                                    │ │  ← one dominant task (act)
│   │     ~15 min · due today                                                 │ │
│   │     [ Start ]                                    Open in Coach →         │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   UP NEXT                                                                     │
│    ○  Film B-roll list          ~20 min                                       │
│    ○  ⚑ Edit thumbnail          ~20 min · slipped 1 day     [ Reschedule ]     │  ← integrated recovery
│    ○  Reply to 3 comments       ~10 min                                       │
│    See remaining tasks (2) ▾                                                   │  ← collapse beyond ~3–4
│                                                                              │
│   ✓ DONE TODAY (2)                                              collapse ▾    │  ← wins, muted, collapsed
```

## Section spec

### Day Anchor **[Canvas]**
Answers "How is today going?" — **tasks completed / planned today**, **estimated work remaining**,
and a **simple pace verdict**:

```
   2 of 5 done · ~45 min remaining        On track — keep going.
   3 tasks remain · ~70 min               A little behind — protect the next task.
```

Do **not** duplicate the overall Execution Score here — HOME owns overall execution health; TODAY
owns today's operational state.

### NOW **[Canvas]**
- **Exactly one** dominant task — the current highest-priority executable task from the existing
  planning/dependency logic. The user never chooses between multiple primary actions.
- Primary action: **Start Task** (may set status to In Progress and timestamp the start). Secondary
  ghost: **Open in Coach →** for help/drafting.
- On complete: a check animates (Cockpit), the item moves to DONE, the next promotes to NOW, day
  progress advances, the score ticks.
- If no task is available: a **deliberate empty state**, never an empty card.

### UP NEXT **[Canvas]**
- Lightweight — enough to give confidence the rest of the day is under control, without becoming a
  backlog. **Show ~3–4 items**; collapse the remainder behind **"See remaining tasks."**
- Ordered by the planning/dependency sort; dimmed relative to NOW.

### Recovery (integrated) **[Canvas]**
- A slipped task appears **naturally in the flow** with a quiet indicator (`⚑ slipped 1 day`) and a
  **Reschedule** action. If an overdue task becomes the most important executable task, it may
  legitimately become NOW. **Recovery is rerouting, not punishment** — never a top failure band.

### DONE TODAY **[Canvas]**
- Collapsed by default, muted, with a count and timestamps. Expanding it is a small, deliberate
  reward — the day's trophy case. Completed items never clutter the active view.

### Cockpit on TODAY **[Cockpit]**
Nav · Coach (focus guidance) · day progress · a mirror of the NOW action (always reachable). **TODAY
remains fully usable with the Cockpit closed** (native checkboxes complete tasks on the Canvas).

## States

- **Empty day:** hero + a warm empty state ("Nothing scheduled today — pull your next task forward,
  or plan the week?"). Emptiness reads as relief.
- **Everything done:** a genuine milestone Moment ("Day cleared — {N} tasks, all on time.") — rationed
  celebration.
- **Overloaded day:** the Day Anchor turns `warning` ("6 tasks · ~4 hrs — that's a lot"); the Coach
  offers to reschedule the lowest-priority items. The product notices overload and helps.
- **Time-aware:** morning ("Let's start"), midday ("Halfway — nice pace"), evening ("One left —
  finish strong or reschedule, no guilt").

## Anti-patterns

- ❌ A sortable/filterable table of tasks.
- ❌ Status enum text — state is position (NOW / UP NEXT / DONE) + glyph.
- ❌ A top "Needs Attention" failure band.
- ❌ Hiding the finish line — always show "N left · ~X min."
- ❌ A built-in countdown timer (parked to v1.1); keep the component architecture extensible so one
  can be added later without redesigning TODAY.

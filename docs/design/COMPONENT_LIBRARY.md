# CreatorOS — Component Library

> The reusable building blocks. Every screen is assembled from these. Tokens:
> [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Surfaces: **[C]** Canvas · **[K]** Cockpit · **[C/K]** both.
> Status: **approved baseline.**

---

### 1. App Shell **[C/K]**
Canvas (spine + content grid, gridlines off) + docked Cockpit sidebar. The shell is constant; only
the Canvas content and the Cockpit's contextual middle change per screen. **The Canvas is
self-sufficient; the Cockpit enhances and may be closed.**

### 2. Nav Item **[K]**
Icon (Lucide-subset, 20px) + label; active = `brand-tint` + trailing dot. Exactly five
(Home/Today/Ideas/Content/Dashboard), flat. Native sheet tabs are the fallback wayfinding.

### 3. Section Header **[C]**
`label` eyebrow (UPPERCASE, tracked) + optional single icon + optional count/`collapse ▾`. Quiet;
separated by `space.3` of empty space, not a divider line.

### 4. Card (base) **[C/K]**
`surface` on `canvas`; read as a card via contrast + whitespace (no heavy border). Cockpit adds
10–12px radius + soft shadow + hover lift. One card = one idea.

### 5. Metric Card **[C/K]**
`label` caption · value (26pt tabular) · **Trend Indicator** · one-phrase context. Optional mini
bar/sparkline. Thin-data → "—" + "gathering." The value is the hero.

### 6. Day Anchor **[C]**
TODAY's orientation line: tasks done / planned · estimated remaining · pace verdict. Never the
Execution Score (that's HOME/DASHBOARD).

### 7. Task Line **[C]**
Glyph (`▶` now / `○` next / `✓` done) · verb-first title · meta (`~15 min · due today`) · action(s).
Variants: **NOW** (loud, primary **Start Task**), **UP NEXT** (dimmed), **DONE** (muted, timestamp),
**recovery** (`⚑ slipped 1 day` + Reschedule, integrated in flow). State = position + glyph, never enum text.

### 8. Idea Row / Idea Card **[C]**
Two densities. **Spark row:** title · readiness · optional pillar · one action. **Developed idea:**
title · angle · pillar · platform/format · readiness · action. Plus the persistent **Capture Input**
(hero, one field). Never a quality rating.

### 9. Readiness Signal **[C/K]**
Three objective states — **JUST A SPARK / SHAPED / READY TO BUILD** — from explicit completeness
rules. Answers "enough info to produce?" only; never quality, promise, or AI judgment.

### 10. Content Card **[C]**
Title · platform·format chips · **Status Verdict** (leads) · eta phrase · task-% bar (support) ·
optional `⚑` · Open →. Readiness is expressed as a verdict, not a percentage headline.

### 11. Status Verdict **[C/K]**
Operational health as a word: **Ready to Ship / On Track / At Risk / Stalled** (CONTENT). Derived
from deadline + progress + movement. Color + word together.

### 12. Status Chip **[C/K]**
Tint background + solid dot/text in a semantic color + human word. Always color + word (a11y). One
meaning per color, forever. Brand accent is never used as a status.

### 13. Recommendation Bar **[C]**
The screen's one operational move: "Recommended next to build → Turn into Content" (IDEAS),
"Recommended next" (CONTENT), "Recommended" adjustment (DASHBOARD). Operational, never a quality/
creative judgment; omit or soften to a confidence statement when none is defensible.

### 14. Progress Bar **[C/K]**
`SPARKLINE`/`REPT` (Canvas) or animated `<div>` (Cockpit), health-colored, with a visible remainder.
Variants: readiness, day-progress, setup, health.

### 15. Score Gauge / Score Anchor **[C/K]**
The Execution Score. **[K]** circular SVG gauge; **[C]** 34pt number + Trend + health bar + band word.
The emotional anchor on HOME (current) and DASHBOARD (with journey).

### 16. Improvement Journey **[C]**
The score series over time (`68 → 72 → 75 → 79 → 82`), direction obvious. DASHBOARD centerpiece; reads
from `METRICS_SNAPSHOT`.

### 17. Trend Indicator **[C/K]**
`▲` up (success) / `▼` down (danger) / `steady` (muted) + delta. Direction color-coded, always with
glyph/word.

### 18. Sparkline **[C]**
`SPARKLINE` line/column, no axes, health/brand color, ~6–8 points. Trends only; paired with a
plain-English verdict.

### 19. Button **[K]** (Canvas: menu item / action cell)
Primary (solid `brand`) — one per view · Secondary (`surface`+`line`) · Ghost (text) · Destructive
(text `danger`; solid only inside confirm). Label = verb + object; ≥40px; press = `motion.fast`.

### 20. Quick Action **[K]**
Compact sidebar actions (+ Idea, + Content, Build my week), always reachable; one is primary.

### 21. Coach Block **[K]**
`✦ COACH` + 1–3 context sentences (to this creator, this moment) + one in-context action. Variants:
verdict / focus / narrative / recovery / thinking. A warm voice, not a chatbox; never nags on a timer;
never contradicts or duplicates the Canvas verdict wording; respects approval-staged AI.

### 22. Dialog (Modal) **[K]**
Header (title + ✕) · essentials-first body + `More options ▾` · footer (Cancel ghost + one Primary).
Smart-defaulted, pre-filled from known data, never loses input, Enter submits / Esc cancels.

### 23. AI Review **[K]**
Dedicated proposal-review component: "AI suggestions · you decide" + "Nothing is saved yet" · per-item
**Keep / Edit / Dismiss** · commit states exactly what will be created ("Add 2"). Nothing persists
before approval. Reusable Portable Core component.

### 24. Cockpit Detail Panel **[K]**
Contextual inspection + light editing (content detail, tasks, status, dependencies, quick
adjustments, Coach guidance). Canvas stays visible.

### 25. Toast **[C/K native]**
`SpreadsheetApp.toast` — one warm factual line. Evidence, not "Success!".

### 26. Success Moment **[K]**
Slide-in card + specific earned praise + rationed confetti. Triggers only: published · week approved ·
first content · day cleared · streak milestone. Respects reduced-motion.

### 27. Empty State **[C/K]**
One soft mark · opportunity-framed headline · one encouraging line · one primary action. Potential,
never failure. Per-screen + first-run vs returning variants.

### 28. Confirmation **[C/K native/modal]**
For consequential/destructive actions. States the specific effect; preserves data; never silent.

### 29. Badge **[C/K]**
Tiny count/marker (nav counts, "3 ready", streak 🔥). Sparing; muted unless it must pull the eye.

### 30. Progress Dots **[C/K]**
`● ● ○ ○` + "2 of 4" for onboarding/setup; always shows the finish line; pairs with "Finish later."

---

## Parked to v1.1 (not built now)
**Focus Timer** (TODAY) · **CONTENT Board** and **Timeline** views · exact time-blocking lens. Keep
component architecture extensible so these slot in without redesign. See
[../LAUNCH_READINESS.md](../LAUNCH_READINESS.md).

## Component → screen matrix

| Component | Home | Today | Ideas | Content | Dashboard |
|---|:--:|:--:|:--:|:--:|:--:|
| App Shell / Nav / Coach / Quick Action | ● | ● | ● | ● | ● |
| Score Gauge/Anchor · Metric Card | ● | | | | ● |
| Improvement Journey | | | | | ● |
| Day Anchor · Task Line | | ● | | | |
| Idea Row · Readiness Signal · Capture | | | ● | | |
| Content Card · Status Verdict | (next-pub) | | | ● | |
| Recommendation Bar | ● | | ● | ● | ● |
| Progress Bar · Trend · Sparkline | ● | ● | | ● | ● |
| Status Chip · Badge | ● | ● | ● | ● | ● |
| Dialog · AI Review · Detail Panel | (add) | | ● | ● | |
| Empty State · Toast · Success Moment | ● | ● | ● | ● | ● |

## Governance
1. No new component without a reason. 2. One meaning per color, one scale, one type system. 3. Every
component defines empty/loading/error, not just the happy path. 4. Interactive/animated → Cockpit;
calm/authoritative → Canvas. 5. Accessible by default (color + word, ≥9pt, AA, reduced-motion,
keyboard-reachable).

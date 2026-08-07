# CreatorOS — Design System

> The single source of truth for tokens. Every screen and component references this file.
> The system is a **family system**: a fixed core (shared by every future toolkit) + one controlled
> identity surface. Tokens are the truth; surfaces are renderers.
> Feasibility legend: **[Canvas]** = the sheet grid · **[Cockpit]** = HTML sidebar/dialog (full CSS)
> · **[Both]** = define once, express per surface. Status: **approved baseline.**

---

## 0. Family architecture

```
  LOCKED FAMILY CORE  (identical across Creator / Compliance / HR / Finance)
   neutrals · semantic colors · typography · spacing · component anatomy ·
   interaction patterns · motion behavior · voice & tone · data-viz rules · accessibility

  TOOLKIT IDENTITY  (the only things a toolkit changes)
   one brand accent · product name / lockup · domain vocabulary · domain icon choices
```

Objective: **same company, different toolkit.** Shared structure provides recognition; controlled
accent and vocabulary provide identity.

## 0.1 Token architecture

Define **abstract tokens** (the source of truth), then their **Canvas** and **Cockpit** expressions.
Screens must never introduce arbitrary colors, spacing, fonts, radii, or shadows — only tokens.

```
  brand.accent        semantic.success   surface.background   text.primary
  semantic.warning    semantic.danger    space.4              radius.card
  motion.standard     type.body          data.health.gradient …
```

## 0.2 Feasibility primer

**Canvas levers:** hide gridlines; cell background; font family/size/weight/color; alignment; wrap;
merged cells; column width + row height (our "padding"); hairline borders; frozen rows/cols;
conditional formatting; number formats; checkboxes; dropdown chips; `SPARKLINE()`; `REPT()` bars;
static icon images.
**Cockpit levers:** all CSS — web fonts, flexbox/grid, transitions, transforms, hover, shadow,
SVG icons, keyframes, shimmers.
**Hard limits (design around these):** no hover/tooltip on grid cells; no sub-cell positioning on
the Canvas; **animation only in the Cockpit** (the Canvas must never pretend to animate); Google-Fonts
set only; the sidebar is a fixed ~300px column.

---

## 1. Typography **[Both]** — family-locked

**Primary UI typeface: Inter** (available in Sheets via *More fonts*). Inter is the UI face for the
whole family; individual toolkits do not introduce their own UI font. Metrics use **tabular figures**.

### Type scale (points)

| Token | Size | Weight | Case / tracking | Use |
|---|---|---|---|---|
| `display` | 34 | 700 | — | The one hero number (Execution Score) |
| `h1` | 22 | 700 | — | Screen title / greeting |
| `metric` | 26 | 700 | tabular | KPI card numbers |
| `h2` | 15 | 600 | — | Section headers |
| `body` | 11 | 400 | — | Default text, list items |
| `body-strong` | 11 | 600 | — | Emphasis within body |
| `label` | 9 | 600 | UPPERCASE, +8% tracking | Eyebrow labels |
| `meta` | 9 | 400 | — | Timestamps, secondary detail |
| `chip` | 9 | 600 | — | Status chip text |

**Rules:** max two weights per block; hierarchy from size + weight + color, never a second accent;
line breathing on the Canvas comes from **row height**, not blank rows; no italics on the Canvas.
The **wordmark/lockup** may use a toolkit identity face (identity only, never UI type).

---

## 2. Spacing & layout grid **[Canvas]** — family-locked

Spacing = column widths + row heights, on an 8px rhythm.

```
 A(spine)    content col 1        content 2       content 3     margin
 ~24px  │  ~180–240px      │  ~180–240px  │  ~180–240px  │  ~24px
 frozen │      cards span merged ranges; ~16px empty gutter columns between cards
```

- **Column A = the spine:** ~24px, frozen, a consistent left margin + subtle vertical accent.
- **Right margin column:** ~24px so content never kisses the edge.
- **Gutters, not borders:** narrow empty columns separate cards.

| Token | Value | Use |
|---|---|---|
| `space.hairline` | 6–8 px | Tightly-related lines |
| `space.1` | 16 px | Default gap |
| `space.2` | 24 px | Between components / margins |
| `space.3` | 40 px | Between major sections |
| `space.hero` | 56–72 px | Around the hero block |

Sections are separated by **empty space**, not lines. **Calm density is a family signature.** Dense
operational information is solved through hierarchy, progressive disclosure, compact components, and
grouping — never by abandoning the spacing discipline.

---

## 3. Color **[Both]**

### Neutrals — family-locked

| Token | Hex | Use |
|---|---|---|
| `ink` | `#16161D` | Primary text, wordmark |
| `ink-2` | `#3A3A44` | Strong secondary text |
| `muted` | `#8A8F98` | Meta, captions, done items |
| `line` | `#ECECEF` | Hairlines, card edges (sparing) |
| `surface` | `#FFFFFF` | Cards, hero |
| `canvas` | `#FBFBF9` | Page background (warm "paper") |
| `sink` | `#F4F4F1` | Recessed zones, zebra tint |

### Brand accent — the one themeable dimension

`brand.accent` is the toolkit's identity. **CreatorOS uses indigo-violet `#5B5BD6`** (temporary
approved accent, pending the future Visual Brand Review), with `brand.press #4646B8` and
`brand.tint #ECECFB`.

- **The accent may never communicate a semantic state** — success, warning, danger, error, or
  completion. Those meanings belong exclusively to semantic tokens. Brand accent is *identity*;
  semantic color is *meaning*; never mix the two responsibilities.
- Family palette for other toolkits is **not** designed until those products exist.

### Semantic set — family-locked (meanings never change between toolkits)

| Meaning | Solid | Tint | Used for |
|---|---|---|---|
| **Success** | `#1F9D6B` | `#E6F5EE` | on-time, published, done, ready |
| **Warning** | `#E8912A` | `#FCF0DE` | due soon, at-risk, capacity |
| **Danger** | `#E5484D` | `#FCEBEC` | overdue, stalled, blocked, error |
| **Info** | `#3B82F6` | `#E7F0FE` | in-progress, informational |
| **Idle** | `#8A8F98` | `#F0F0F2` | backlog, not started, inactive |

Chips are always **tint background + solid text/dot**. The Execution Score and progress fills use a
**health gradient** (danger → warning → success) so color itself reports status.

---

## 4. Iconography **[Both]** — family-locked

Adopt **one mature open-source line-icon system as the family standard** (Lucide or an equivalent),
using a tightly controlled subset. Do not build proprietary iconography for v1.

- One stroke style, consistent weight, consistent sizes (20px optical), consistent naming; never
  mix icon families.
- **SVG in the Cockpit**; exported static equivalents where needed on the Canvas (section headers).
- **Emoji are not functional icons.** Emoji may appear only as deliberately rationed
  personality/delight. Status is carried by **color + word**, icon as reinforcement.

---

## 5. Motion **[Cockpit only]** — first-class, family-locked

The Cockpit uses defined motion tokens; the **Canvas must not pretend to animate** (it renders
discrete new states).

| Token | Duration | Use |
|---|---|---|
| `motion.fast` | 120 ms | button press, hover |
| `motion.standard` | 180 ms | panel/dialog enter, list settle |
| `motion.emphasis` | 240 ms | completion check, reorder |
| `motion.large` | 300 ms | progress fill, score count-up |

Easing: ease-out. **Motion clarifies state change; it never decorates inactivity.** Honor
`prefers-reduced-motion` (degrade to instant opacity).

---

## 6. Voice & tone — first-class, family-locked

The design language talks the same way in every toolkit. Locked principles:

- **Evidence, not praise.**
- **Propose, don't judge.**
- **Orient before reporting.**
- **Name the problem, then show the path.**
- **Confirm with facts.**
- **Recovery is rerouting, not punishment.**
- **Confidence must be earned by evidence.**

Avoid exaggerated language ("Amazing!", "You're crushing it!", "Fantastic job!") unless future
brand research explicitly supports a more playful tone. Speak the domain's vocabulary, never system
machinery (no "records / entities / rows / validation failed").

---

## 7. Data visualization — first-class, family-locked

Every toolkit is metrics-heavy; visualization is shared. The order is always **interpret →
visualize → allow deeper inspection**, never *chart → force the user to interpret it.*

Shared specs cover: KPI numbers (tabular), progress bars, sparklines, trend lines, rings/gauges,
health states (the semantic gradient), comparison/trend indicators (`▲ ▼ steady` + delta), and
**thin-data states** (honest "your story is beginning," never an empty chart skeleton).

- **[Canvas]** bars = `SPARKLINE`/`REPT` in the health color; trends = `SPARKLINE` lines/columns.
- **[Cockpit]** the score gauge = a circular SVG colored by band.
- Every progress element shows the **remaining** portion (a visible finish line).

---

## 8. Interaction surfaces (the four-surface model)

Interaction weight determines surface. These are the only four; introducing another requires
explicit design approval.

| Surface | Use |
|---|---|
| **Inline** | single-field, immediate capture (e.g., quick-capture a spark) |
| **Cockpit Sidebar** | contextual detail, inspection, lightweight editing; Canvas stays visible |
| **Modal** | multi-field creation/editing and focused decisions |
| **Confirmation** | consequential or destructive actions |

Full interaction behavior lives in [INTERACTION_GUIDELINES.md](INTERACTION_GUIDELINES.md); component
anatomy in [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md).

---

## 9. Cards, sections, empty states, messages **[Both]**

- **Card:** `surface` on `canvas`, separated by contrast + whitespace (no heavy borders); Cockpit
  cards add 10–12px radius + soft shadow. One card = one idea.
- **Section:** an eyebrow `label` + its cards, separated by `space.3` of empty space — not a line.
- **Empty state:** a coaching moment — opportunity-framed headline, one encouraging line, one next
  action. Potential, never failure.
- **Success message:** tiered — Micro (a check + score tick), Toast (`SpreadsheetApp.toast`, one warm
  factual line), Moment (Cockpit card + rationed confetti for genuine milestones only). Evidence over
  praise: *"Turned into content — 6 production tasks created,"* never "Success!".
- **Warning message:** partner tone; a `warning`/`danger` tint paired with a recovery action; lives
  in context, never a full red screen; a problem is never shown without a way out.

---

## 10. Accessibility — family-locked

- Body text ≥ AA (4.5:1); large text/metrics ≥ 3:1; `muted` only ≥ 15pt or non-essential.
- **Never color-only** — every status carries color + word (+ optional glyph).
- Type floor 9pt; body 11pt.
- Honor `prefers-reduced-motion`; Cockpit controls ≥ 40px with a visible `brand` focus ring.
- Plain, concrete, jargon-free language (an accessibility *and* a "built-for-me" win).

---

## 11. Token quick-reference

```
INK #16161D  INK-2 #3A3A44  MUTED #8A8F98  LINE #ECECEF  SURFACE #FFF  CANVAS #FBFBF9  SINK #F4F4F1
BRAND(accent, CreatorOS) #5B5BD6  PRESS #4646B8  TINT #ECECFB   ← identity only, never semantic
SUCCESS #1F9D6B/E6F5EE  WARNING #E8912A/FCF0DE  DANGER #E5484D/FCEBEC  INFO #3B82F6/E7F0FE  IDLE #8A8F98/F0F0F2
Type: Inter.  display34 / h1-22 / metric26 / h2-15 / body11 / label9 / meta9   (tabular metrics)
Spacing 8px → 16/24/40/56.  Spine ~24px.  Cards = surface-on-canvas.
Motion (Cockpit only) 120/180/240/300 ease-out.  Delight rationed.  Icons = Lucide-subset, no emoji-as-icon.
Surfaces: Inline · Cockpit Sidebar · Modal · Confirmation.
```

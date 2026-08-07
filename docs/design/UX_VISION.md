# CreatorOS — UX Vision

> The philosophy. Read this before any screen spec; every other design document implements it.
> Companion: [SALES_PSYCHOLOGY.md](SALES_PSYCHOLOGY.md) (the *why*), [PORTABLE_CORE.md](PORTABLE_CORE.md)
> (the reusable family language), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (the tokens).
> Status: **approved baseline.**

---

## The vision

**CreatorOS is a calm, opinionated execution companion for the solo creator — an application that
happens to be rendered inside Google Sheets, not a spreadsheet with better formatting.** Within
thirty seconds the creator stops thinking "I'm in a spreadsheet" and starts thinking "I'm in my
studio."

## What the customer actually buys

Not features. A **transformation**: *overwhelmed → focused, spontaneous → organized, uncertain →
clear, inconsistent → controlled execution.* The product's job is to make that transformation
**visible**. The mechanism that proves and delivers it is the **flywheel**:

```
   Idea → Content → Plan → Tasks → TODAY → Execution measured
```

The transformation is what they buy. The flywheel is how CreatorOS proves and delivers it. The
design must never reduce the value proposition to the workflow itself.

## The two-surface architecture

CreatorOS presents through two surfaces with different jobs. Confusing their roles is the primary
way the design fails.

```
┌───────────────────────────────────────────────┬───────────────────────┐
│  THE CANVAS  (the sheet grid, gridlines OFF)   │  THE COCKPIT (sidebar)│
│  • Calm, authoritative, magazine-style read    │  • The app "chrome"   │
│  • HOME / TODAY / IDEAS / CONTENT / DASHBOARD   │  • Persistent nav     │
│  • Spacious, typographic, low-interaction       │  • The Coach (voice)  │
│  • SELF-SUFFICIENT — works with Cockpit closed  │  • Quick actions      │
│                                                │  • Rich detail / edit │
│                                                │  • Motion, hover, CSS │
│                                                │  • ENHANCES, never     │
│                                                │    gates core work    │
└───────────────────────────────────────────────┴───────────────────────┘
```

- **The Canvas** wins the *perceived-value* battle: no gridlines, generous whitespace, real type
  hierarchy, cards and sections from merged cells and color.
- **The Cockpit** wins the *feels-like-software* battle: full CSS, hover, motion, the Coach, and
  the AI proposal-review.
- **Locked principle:** the **Canvas must remain fully functional without the Cockpit.** If the
  sidebar is closed, unavailable, or fails to load, the creator can still operate the essential
  product. The Cockpit is an enhancement layer, never a dependency for core execution.

Rule: *interactive or intelligent → Cockpit; calm and authoritative → Canvas.*

## How the creator should feel

Ranked; when these conflict, the earlier wins.

1. **Calm** — the dominant emotion. The creator arrives overwhelmed; CreatorOS lowers their heart
   rate through subtraction, whitespace, and one next move.
2. **Capable** — "I've got this," manufactured one small, winnable action at a time.
3. **Seen** — "this noticed me": their name, their numbers, their pain named, their comeback caught.
4. **Proud** — earned via evidence (the score rising, the streak), never via empty praise.
5. **Delighted (rationed)** — a rare, earned moment; the seasoning, never the meal.

Never: overwhelmed, judged, lost, uncertain what to click, or worried their data is unsafe.

## The universal screen spine

Every Canvas screen follows one pattern (the Portable Core spine):

```
   Orient  →  recommend one operational move  →  core content  →  support  →  dignified problem-handling
```

- **Leads with orientation, not data** — a verdict of "how am I doing / what matters," before any list.
- **Exactly one primary move** — louder than everything else; the product decided for you.
- **Ranks and dims** — never a flat, equal-weight list.
- **Mostly empty at rest** — whitespace is the default.
- **Speaks creator** — no enums, IDs, formulas, or system machinery; status is a colored chip with
  a human word, a date is "in 3 days," progress is a bar.
- **Never opens on failure** — problems are integrated with dignity, never a top "you're behind" band.
- **Beautiful at zero state** — a designed value-first handoff, never empty KPI blocks or zeros.

## First impression

- **5-second test:** the sheet opens to a clean, branded, mostly-white screen — their name, one
  friendly number, one obvious move. No grid, no column letters, no wall of data. First thought:
  *"oh — this is nice,"* not *"a spreadsheet."*
- **First five minutes:** *Impress → Demonstrate → Activate → Personalize* — the creator watches the
  flywheel run before doing any setup, does one tiny real thing, and thinks *"this was built for
  me."* See [FIRST_5_MINUTES.md](FIRST_5_MINUTES.md).

## What CreatorOS avoids (hard rules)

- **The spreadsheet tell** — visible gridlines, column letters, raw enums, A1 references, cells that
  look editable when they aren't.
- **The flat list** — equal-weight rows that push triage onto the user.
- **The blank page** — any first-run that asks the user to build the tool before using it.
- **Configuration in the critical path** — power lives behind a door, never in the hallway.
- **Machine voice** — every message sounds like a thoughtful human wrote it.
- **Silent destruction** — confirm irreversible actions; preserve user data on every repair.
- **Over-delight / toy energy** — premium is restrained; delight is rationed.
- **Unsolicited judgment of the user's work** — we evaluate *process readiness*, never the quality
  of the user's ideas or outcomes.
- **Promising outcomes** — we own the journey (organized, visible, tracked, recoverable); growth,
  revenue, and virality remain the creator's and the market's.

## Design north stars

We borrow a discipline, not a look: **Linear** (opinionated minimalism), **Superhuman** (one
triaged thing at a time), **Notion** (typographic warmth), **Arc** (rationed joy). We are not
enterprise dashboards, gamified habit apps, or generic blue-gradient SaaS.

## Success criteria

1. A first-time viewer, shown a screenshot with no context, does **not** say "spreadsheet."
2. A creator can answer **"what do I do right now?"** in under 3 seconds on any screen.
3. After a 5-minute demo, a Notion/Trello/Sheets user says **"yes, I'd pay $29"** — because they saw
   the flywheel run and it felt made for them.
4. Nothing in the experience makes the creator feel judged, lost, or unsafe.

If a choice doesn't move at least one criterion, it's decoration — cut it.

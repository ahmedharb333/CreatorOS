# CreatorOS — Interaction Guidelines

> How the product behaves — surfaces, motion, feedback, and states. This is where "spreadsheet" vs
> "application" is decided. Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Status: **approved baseline.**
> Feasibility: motion lives in the **[Cockpit]**; the **[Canvas]** renders discrete state changes,
> never tweened animation.

---

## Guiding principle

**Every action gets a proportional, specific reaction — within ~200ms of feeling.** Silence after an
action reads as broken/cheap; over-reaction to trivial actions reads as a toy. Motion clarifies
cause→effect; it never decorates or delays.

## 1. The four interaction surfaces (chosen by interaction weight)

The only four surfaces. Introducing another requires explicit design approval.

| Surface | Use | Examples |
|---|---|---|
| **Inline** | single-field, immediate capture | quick-capture a spark |
| **Cockpit Sidebar** | contextual detail, inspection, lightweight editing | content detail + its tasks, status, dependencies, quick adjustments, Coach guidance |
| **Modal** | multi-field creation/editing and focused decisions | New Content, full Add-Idea details, AI Review |
| **Confirmation** | consequential or destructive actions | delete, clear, ship |

The Canvas stays visible behind the Cockpit sidebar, reinforcing the two-surface model rather than
creating a second full workspace.

## 2. Shared dialog (Modal) anatomy

```
┌───────────────────────────────────────────┐
│  Title                                 ✕   │  header: title + close
├───────────────────────────────────────────┤
│  Essential fields first (one/row, ≤2 cols) │  smart-defaulted, pre-filled from known data
│  More options ▾                            │  progressive disclosure for secondary fields
├───────────────────────────────────────────┤
│              [ Cancel ]   [ Primary → ]    │  one primary action, right
└───────────────────────────────────────────┘
```

- The fast path is **open → review defaults → adjust one thing → confirm.** Avoid long blank forms.
- **Create Content** shows only fields necessary to create a usable item; secondary fields hide behind
  *More options*; where an idea already carries information, **pre-fill it** — never ask the user to
  re-enter what CreatorOS already knows.
- Labels above fields; Enter submits; Esc cancels; open/close = `motion.standard` fade + 8px rise.
- Validation is **inline and kind** ("Add a title so we can find it later"), never a blocking alert.

## 3. AI Review (dedicated proposal-review component)

A trust-critical, reusable component — **not** a generic form.

```
┌─────────────────────────────────────────────┐
│  AI suggestions · you decide            ✕     │
│  These are proposals. Nothing is saved yet.   │  ← explicit trust framing
├─────────────────────────────────────────────┤
│  ✦ "3 hooks that stop the scroll"             │
│     Education · Short     [Edit] [Dismiss] [✓ Keep] │  ← per-item Keep / Edit / Dismiss
├─────────────────────────────────────────────┤
│  2 selected                    [ Cancel ] [ Add 2 ] │  ← commit states exactly what will be created
└─────────────────────────────────────────────┘
```

**No AI recommendation is persisted before explicit user approval.** AI proposes; the user decides.
This becomes a Portable Core component reusable across future toolkits.

## 4. Navigation

- **Primary nav = the Cockpit sidebar** (Home / Today / Ideas / Content / Dashboard), active item
  marked with `brand-tint` + a dot. Selecting a destination activates the sheet **and** updates the
  Cockpit's contextual content.
- **Secondary = the native sheet tabs** (styled, creator-cased; system sheets hidden in Creator Mode).
- Five destinations, flat — no deep nesting. **Because the Cockpit may be closed, the native tabs
  remain a complete wayfinding fallback and the Canvas is self-sufficient.**

## 5. Feedback ladder (match the rung to the stakes)

| Rung | Surface | Example |
|---|---|---|
| Inline | Cockpit | field validation, a chip changing color |
| Toast | Native | `SpreadsheetApp.toast` — one warm factual line |
| Panel confirm | Cockpit | "Turned into content — it's now in production" |
| Moment | Cockpit | milestone → card + rationed confetti |
| Blocking confirm | Native/Modal | only for genuinely destructive actions |

**Evidence-based confirmations** (mandatory): state what actually happened.
- *"Turned into content — 6 production tasks created."*
- *"Weekly plan approved — 8 tasks are ready for Calendar."*
- *"Calendar synchronized — 7 events updated."*

Never generic "Success!". Every state-changing action produces at least a toast.

## 6. Motion **[Cockpit]**

Use the motion tokens (`fast 120 · standard 180 · emphasis 240 · large 300`, ease-out). Typical uses:
panel enter (`standard`), button press (`fast`, 1px inset + `brand.press`), completion check
(`emphasis`), progress fill / score count-up (`large`), milestone confetti (rationed). The **Canvas
does not animate** — it renders a new state after the action (a completed task appears in DONE on
re-render). Honor `prefers-reduced-motion` (degrade to instant fades).

## 7. Loading

Never a frozen screen. Operations >300ms show a state: a **shimmer/skeleton** on the area being
filled, or an inline **spinner + verb** ("Building your week…", "Thinking…"). AI calls always show a
labeled working state. Optimistic where safe (a check flips instantly, then reconciles).

## 8. Error states

Plain language, a cause, and a way out — never a stack trace, never a raw code. "That calendar could
not be found — reselect one," not "CALENDAR_NOT_FOUND." Blame the system, not the user. Pair every
error with a recovery action.

## 9. Never lose input (mandatory)

If validation fails, a provider/network call fails, or the user accidentally closes a populated form,
**preserve entered values** wherever technically practical. Use a discard confirmation only when
meaningful input exists.

## 10. Empty states

Every empty view is a coaching moment — opportunity-framed headline, one encouraging line, one next
action. Potential, never failure. Match the creator's stage.

## 11. Success moments

Tiered (Micro / Toast / Moment). **Confetti is reserved for meaningful milestones only** (published,
week approved, first content, day cleared, streak milestone). Celebrate outcomes the creator cares
about, named specifically, in the evidence register — never generic praise, never twice for the same
trivial action, always respecting reduced-motion.

## The interaction contract

> Interaction weight determines surface. Never ask the user to re-enter known data. AI proposes; the
> user decides. Important confirmations state evidence. Typed work survives recoverable errors. The
> Canvas is self-sufficient; the Cockpit enhances. Motion clarifies; it never decorates or delays.

# The Toolkit Design Language — Portable Core

> The reusable product-family language, defined **independently of CreatorOS.** Any future toolkit
> (Compliance, HR, Finance, …) inherits everything here unchanged and supplies only a thin **domain
> layer.** This document is the asset that outlives any single product.
> Status: **approved baseline.**

---

## The premise

A family of toolkits should feel like they came from the same company: a customer who has used one
should immediately understand another, and their trust should transfer. That is achieved by sharing a
**vast core** and varying a **tiny, controlled identity surface.**

```
   Shared structure  →  recognition.        Controlled accent + vocabulary  →  identity.
```

## Core vs Domain — the split

| Layer | What it contains | Changes per toolkit? |
|---|---|---|
| **Portable Core** | archetypes · the universal spine · interaction model · two-surface architecture · AI stance · onboarding framework · voice · tokens · commercial philosophy | **No** |
| **Domain Layer** | the transformation & pain · the flagship health metric · the named mechanism (flywheel) · vocabulary · workflows/defaults · one brand accent · product lockup · domain icons | **Yes** |

---

## 1. The four screen archetypes

Every toolkit screen is one of these. Each shares the same DNA: *orient first, offer one next move,
handle problems with dignity, never pass unsolicited judgment on the user.*

1. **Act screen** — converge to action. *Orient → one action → ordered next work → completed progress
   → dignified recovery.* (CreatorOS: HOME, TODAY.)
2. **Collection screen** — capture and triage. *Capture → assess readiness → recommend an operational
   next move → browse the remainder → park without guilt.* (CreatorOS: IDEAS.)
3. **Pipeline / Manage screen** — a self-aware production line. *Orient (pipeline health) → recommend
   the move that most improves flow → items with self-derived status verdicts → graceful handling of
   stalled work.* Status is derived from underlying work + deadlines, never a manual, never a quality
   call. (CreatorOS: CONTENT.)
4. **Reflect / Insight screen** — prove progress over time. *Orient with evidence → recommend one
   adjustment when justified → improvement in what the user controls (leading) → outcomes (secondary)
   → thin-data grace → optional deeper interpretation.* (CreatorOS: DASHBOARD.)

## 2. The universal spine

```
   Orient  →  recommend one operational move  →  core content  →  supporting detail  →  dignified problem-handling
```

Never open on a task list or a failure band. Always lead with a verdict of "how am I doing / what
matters." Exactly one primary move per screen. Rank and dim; mostly empty at rest; beautiful at zero
state. **Lead with what the user can control; use outcomes to inform decisions, not to define success.**

## 3. The two-surface architecture

- **Canvas** (the grid, gridlines off): calm, authoritative, **self-sufficient.**
- **Cockpit** (HTML sidebar): interactive, alive — nav, the Coach, quick actions, detail, the AI
  proposal-review. **An enhancement layer that must never gate core execution.** If it is closed or
  fails to load, the Canvas still operates the essential product.

## 4. Interaction model — four surfaces by weight

**Inline** (single-field capture) · **Cockpit Sidebar** (contextual detail/inspection) · **Modal**
(multi-field create/edit and focused decisions) · **Confirmation** (consequential/destructive).
Introducing a fifth requires explicit design approval. Never ask the user to re-enter known data;
typed work survives recoverable errors.

## 5. AI stance

AI **proposes; the user decides.** Opt-in and advisory; a dedicated proposal-review pattern (Keep /
Edit / Dismiss; nothing saved before approval); **out of the critical onboarding path.** The system
may evaluate *process readiness*; it must **never** pass unsolicited judgment on the user's judgment,
ideas, or outcomes.

## 6. The onboarding framework

```
   Impress (a live, curated sample world)
   → Demonstrate the mechanism (show it running — never explain it)
   → Activate (one tiny real action, <10s, evidence-confirmed)
   → Transfer ownership (a deliberate commit moment)
   → Personalize later (deferred, optional, rewarded)
```

Value before setup. The demonstrated mechanism is the commercial centerpiece and the natural referral
trigger.

## 7. Voice & tone

Evidence, not praise · Propose, don't judge · Orient before reporting · Name the problem, then show
the path · Confirm with facts · Recovery is rerouting, not punishment · Confidence must be earned by
evidence · **Judge process, not people.** Speak the domain's vocabulary; never expose system machinery.

## 8. Token architecture

**Fixed family core:** neutrals · semantic colors (fixed meanings: success/warning/danger/info/idle)
· typography (Inter) · spacing (8px rhythm, calm density) · component anatomy · motion
(120/180/240/300, Cockpit only) · voice · data-viz (interpret → visualize → inspect) · accessibility.
**One themeable dimension:** a single `brand.accent` that is **identity, never meaning** — it may
never communicate a semantic state. Tokens are the source of truth (abstract token → surface
expression); screens introduce no arbitrary values.

## 9. Commercial philosophy

> Sell the transformation. Demonstrate the mechanism. Reduce uncertainty. Judge process, not people.
> Earn trust through evidence. Make value visible before asking for effort. Build each toolkit so
> trust transfers to the next.

**The boundary:** each toolkit owns the *journey* (organized, visible, tracked, recoverable); the
*outcome* remains the user's and the market's.

---

## The domain layer — what each toolkit supplies

A toolkit is defined by filling this small template; everything else is inherited.

| Domain slot | CreatorOS | Compliance* | HR* | Finance* |
|---|---|---|---|---|
| **Transformation** | chaos → controlled execution | exposed → audit-ready | scrambling → systematic | frantic → closed-on-time |
| **Flagship health metric** | Execution Score | Compliance Score | Onboarding Readiness | Close Health |
| **Named mechanism (flywheel)** | Idea → Content → Plan → Tasks → Execution | Finding → Control → Attestation → Assurance | Req → Pipeline → Onboarding → Retention | Entry → Review → Close → Confidence |
| **Collection screen** | Ideas | Findings | Candidates | Entries |
| **Pipeline screen** | Content | Controls | Candidates-in-stage | Close tasks |
| **Vocabulary** | idea / content / publish / pillar | finding / control / attest | req / candidate / onboard | entry / review / post |
| **Brand accent** | indigo-violet `#5B5BD6` | tbd | tbd | tbd (not green — collides with success) |

\* *Compliance / HR / Finance are illustrative. Their palettes and specifics are designed only when
those products actually exist.*

---

## The one principle to remember

> **Consistency creates inherited trust.** A vast shared core provides recognition; a tiny controlled
> identity surface provides difference. Same company, different toolkit.

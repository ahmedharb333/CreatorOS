# CreatorOS — Launch Readiness (product strategy, not engineering)

**Status:** MVP architecture complete. **Feature freeze in effect.** This document governs the next phase:
polish → test with real creators → fix friction → *then* decide v1.1. It is a product-strategy artifact, not
a build plan.

---

## The launch north-star

> **Would a creator who currently uses Notion, Trello, or Google Tasks pay $29 for CreatorOS after a
> 5‑minute demo?**

If the answer is not an immediate **yes**, the fix is **never a new feature**. The fix is a better demo,
onboarding, messaging, or perceived value — until the answer becomes yes. This question guides every launch
decision from here.

## What we do now (the only allowed lanes)

- usability refinements · bug fixes · performance · onboarding improvements · visual polish · documentation ·
  marketplace readiness.

## What we do NOT do

- No major new functionality. The architecture can support more — **resist that.** Feature expansion is driven
  by observed user friction, not anticipated requirements. New ideas go to a **v1.1 candidate list** and wait
  for evidence.

---

## Creator testing protocol (10–20 real creators)

1. **Recruit** 10–20 from the primary segment (YouTube-led solo creators, `02_Product_Strategy.md §5`). A few
   from segment B (LinkedIn consultants) for contrast.
2. **Run the 5‑minute demo** exactly as `FIRST_5_MINUTES.md` describes: open → **Try Sample Workspace** →
   Execution Score → complete a task → AI Review → "I get it."
3. **Watch where they hesitate.** Say nothing; note every pause, wrong click, re-read, or "what do I do here?".
   Hesitation = a friction point, not a user error.
4. **Log friction** (template below). Rank by frequency × severity.
5. **Fix the top friction points** (within the allowed lanes only).
6. **Only then** decide what belongs in v1.1 — from evidence, not intuition.

### Friction log (template)

| # | Screen / step | What they did | Where they hesitated | Frequency | Severity | Fix (lane) |
|---|---|---|---|---|---|---|
| | | | | | | |

### Signals to capture
- Time to first "I understand what this does."
- Did they reach the Execution Score unaided?
- Did the sample workspace land the value, or confuse?
- Would they pay $29 now? If not — what would make it a yes? (verbatim quotes are gold)

---

## Pre-launch checklist (marketplace readiness)

Maps to `22_Installation_Upgrade_Release.md`, `02_Product_Strategy.md`, `29_Permissions_...`.

### Product evidence (close before charging money)
- [ ] **I-06** bound-project Calendar walkthrough (real Google Calendar).
- [ ] **I-07** live-provider AI check (each provider; key never in cells/AI_LOG).
- [ ] **I-08** Creator Experience walkthrough (HTML dialogs + felt 5-minute flow) — doubles as demo footage.
- [ ] On-Google `Run Tests` green on a fresh bound copy (I-01); clean **copy-install** test (a copied workbook
      carries no prior secrets/calendar/AI key).

### Delivery package (`22 §1`)
- [ ] Workbook + Apps Script (via clasp) · setup guide · authorization guide · calendar guide · AI provider
      guide · troubleshooting guide · changelog · **license terms** · **sample workspace** (already flagship).

### Commercial (`02 §6–8`)
- [ ] Editions finalized: **Basic $19–29**, **Pro $39–59**, Team future (no billing/tier-gating in v1;
      capability-based, per COMMERCIAL_ROADMAP).
- [ ] Distribution: Gumroad (or equivalent) + a simple landing page.
- [ ] **Product-page copy** built around the three selling moments and the 5‑minute demo — not a feature list.
- [ ] Refund + support policy.

### Trust / privacy (`29`)
- [ ] Privacy notice: what's stored in the workbook, what may be sent to AI providers, no social accounts in
      v1, customer controls deletion, seller doesn't centrally receive content.
- [ ] Permissions disclosed before authorization (staged scopes).

### Polish pass (evidence-led, after testing)
- [ ] Empty states read naturally on every creator screen.
- [ ] HOME reads at a glance; Execution Score is unmistakably the hero.
- [ ] Messaging is creator-language, not system-language (no "repositories/schema/IDs" anywhere a creator sees).

---

## v1.1 candidate list (parked — needs evidence before building)

Kept so nothing is lost, but **none are started** without observed demand.

**Parked before UX review:**
- Notifications (FR-020) + opt-in auto-sync trigger.
- Richer HTML setup wizard (must call SetupService).
- Recovery / Performance dialogs.
- AI review "accept selected / edit" for weekly plan + repurposing.
- Publishing-milestone all-day calendar events (O-3).

**Parked by the UX baseline (2026-08-07)** — see `docs/design/UX_BASELINE.md`:
- **Focus Timer** (TODAY) — v1 primary action is "Start Task"; keep components extensible for a timer.
- **CONTENT Board** view (Kanban) — only if we can deliver first-class Kanban.
- **CONTENT Timeline** view (publishing cadence lens).
- **Exact time-blocking lens** (clock-driven TODAY) — default stays priority-driven.
- **Advanced mobile functionality** — v1 mobile is a view-mostly companion (desktop-first).
- **Additional dialogs** beyond the approved set.

**Decision rule:** an item leaves this list only when creator testing shows the friction it removes is real.

---

## The one line to remember

The architecture is done. The next competitive advantage is **making the power feel simple and obviously
worth $29 in five minutes** — earned by watching real creators, not by adding capabilities.

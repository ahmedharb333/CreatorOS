# CreatorOS — Commercial Roadmap (editions)

**Status:** DRAFT for Product Owner review. Strategy/design artifact — **no tier gating or billing is
implemented in v1** (out of scope per the charter). Its purpose is to keep Calendar, Notifications, and AI
architecturally tier-friendly so future editions don't require rework.

Aligns with `docs/02_Product_Strategy.md` (which already defines Basic / Pro / future Agency editions) and
adopts the Product Owner's naming: **Free · Pro · Team**.

> ⚠️ **Open decision (D-ROADMAP-1):** `02_Product_Strategy.md` specifies a **one-time purchase** model with a
> paid **Basic** edition ($19–29) and **Pro** ($39–59) — there is **no free tier** in the approved strategy.
> The proposed "Free" edition conflicts with that. Please confirm one of:
> (a) "Free" = a genuine free tier (new pricing model — a strategy change), or
> (b) "Free" is a rename of the paid **Basic** edition. This roadmap assumes (b) unless you say otherwise, and
> does not change v1 scope either way.

---

## Edition matrix (target)

| Capability | Free / Basic | Pro | Team (future) |
|---|:--:|:--:|:--:|
| Setup, ideas, content DB | ✓ | ✓ | ✓ |
| Workflow library + task generation | ✓ (default library) | ✓ (+ clone/customize) | ✓ |
| Capacity + weekly plan + Today | ✓ | ✓ | ✓ |
| Dashboard (rule-based) | ✓ | ✓ | ✓ |
| Calendar **view** (overview tab) | ✓ | ✓ | ✓ |
| **Calendar push / sync** to Google Calendar | — | ✓ | ✓ |
| Missed-task **recovery engine** | basic | ✓ (full) | ✓ |
| **Repurposing** workflows | — | ✓ | ✓ |
| **Email reminders / auto-sync triggers** | — | ✓ | ✓ |
| **Optional AI** (customer-funded key) | — | ✓ | ✓ |
| Collaboration / roles / shared workspaces | — | — | ✓ |
| Multiple / shared calendars | — | (future) | ✓ |

(Matches `02_Product_Strategy.md`: Basic = rule-based, no AI, calendar views; Pro = + calendar push,
reminders, recovery, repurposing, optional AI; Agency/Team = collaboration — deferred.)

## How this shapes the upcoming milestones (design constraints, not features)

The following are **design principles** to honor now so tiers remain a config change later. None expand v1 scope.

### Milestone 3 — Calendar
- `CalendarService` takes the **calendar id as a parameter** (never hard-codes a single global calendar) →
  Team multi-calendar becomes additive.
- Push/sync is a **capability** ("calendar_push") and the auto-sync trigger is a separate opt-in feature →
  Free can ship with calendar **view** only; Pro flips the capability on with no code change.
- See `docs/Calendar_Event_Contract.md §13`.

### Milestone 4 — Recovery / Repurposing
- Recovery core (detect + manual reschedule) is edition-agnostic; advanced automated recovery and
  **repurposing** are Pro capabilities behind flags.

### Milestone 5 — Notifications / AI
- **Reminders** (email) and **AI** are Pro capabilities. AI is already customer-funded and optional per the
  charter, which fits Pro cleanly. Keep the provider abstraction and reminder triggers behind capability
  checks.

### Data model
- The single-user v1 model stays; Team is anticipated by the existing `Owner` field on CONTENT and the fact
  that all records already carry immutable IDs. No teams/accounts/billing are built in v1.

## Proposed lightweight mechanism (for a LATER milestone — not v1)

A single `EDITION` value in CONFIG plus a small `Capabilities` map (e.g. `calendar_push`, `ai`, `reminders`,
`repurposing`, `recovery_advanced`, `collaboration`) that services consult via one helper
(`isEnabled(capability)`), defaulting to **enabled** so v1 behaves exactly as today. This is **documented, not
implemented** — it would be introduced only when tiering is actually turned on (likely alongside M5/M6), and
only with Product Owner approval, to avoid premature scope creep.

## Commercial success metrics

Carried from `02_Product_Strategy.md §11–12` (validation via paid customers, retention, calendar-push
adoption, willingness to pay recurring for Pro/Team). Revisit pricing once D-ROADMAP-1 is decided.

## Next step

Confirm D-ROADMAP-1 (Free tier vs. paid Basic) and approve the tier boundaries. The Calendar Event Contract
already reflects these constraints, so approving both together keeps Milestone 3 unblocked.

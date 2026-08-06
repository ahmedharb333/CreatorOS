# CreatorOS — Concept: Strategic Goal vs Content Objective

**Correction item 3.** These two fields were easy to confuse because both are strategy-flavored enums and
early drafts shared words ("Awareness", "Engagement"). This document defines them precisely, makes their
vocabularies **disjoint**, and states how they relate — so all specifications are internally consistent.

## One-line distinction

- **Strategic Goal** — *why this idea exists.* The creator's **strategic intent** at the **idea** level
  (and, by extension, a content pillar's purpose). Answers: "what is this bet trying to achieve for the brand?"
- **Content Objective** — *what this one piece must do.* The **funnel job** of a single **content** item.
  Answers: "what specific action should this asset drive in the audience?"

Strategic Goal is chosen when capturing an **idea** (`IDEAS.Strategic_Goal`). Content Objective is chosen
when creating a **content** item (`CONTENT.Objective`). An idea (one Strategic Goal) can spawn multiple
content pieces, each with its own Objective.

## Controlled vocabularies (authoritative — mirror `ENUMS` in `src/Constants.js`)

### Strategic Goal (7 values — approved standard, ASSUMPTIONS C2)

`Awareness · Engagement · Authority · Leads · Sales · Community · Retention`

Brand/strategy outcomes. Deliberately broad and durable (they rarely change per piece).

### Content Objective (6 values — funnel stage/verb)

`Reach · Engage · Educate · Convert · Nurture · Monetize`

Per-asset jobs, expressed as verbs/stages so they never collide with the goal nouns. Each maps loosely to a
marketing-funnel stage:

| Objective | Funnel stage | The piece's job |
|---|---|---|
| Reach | Top | Get in front of new audience |
| Engage | Top/Mid | Provoke interaction (comments, shares, saves) |
| Educate | Mid | Teach / build understanding |
| Nurture | Mid | Deepen relationship with existing audience |
| Convert | Bottom | Drive a defined action (sign-up, click, lead) |
| Monetize | Bottom | Drive revenue (sale, offer, upsell) |

## How they relate (typical, not enforced)

A Strategic Goal usually biases which Objectives its content uses — but the mapping is many-to-many and the
creator stays in control:

| Strategic Goal | Common content Objectives |
|---|---|
| Awareness | Reach, Engage |
| Engagement | Engage, Nurture |
| Authority | Educate, Reach |
| Leads | Convert, Educate |
| Sales | Monetize, Convert |
| Community | Nurture, Engage |
| Retention | Nurture, Educate |

CreatorOS does **not** force this mapping in v1; it is guidance for the creator (and, later, a signal the AI
weekly-plan prompt may use). Both fields remain independently selectable.

## Consistency notes

- `src/Constants.js` `ENUMS.STRATEGIC_GOAL` = the 7 values above; `ENUMS.CONTENT_OBJECTIVE` = the 6 values above.
- Data validation on `IDEAS.Strategic_Goal` and `CONTENT.Objective` is generated from these enums.
- Spec docs `04_Master_PRD` / `16_Workbook_Schema` describe `Objective` as a "configured objective" and
  list Strategic Goal; this document is the authoritative value definition for both. The 5→7 goal
  reconciliation in those two spec files is tracked as `KNOWN_ISSUES` I-04 (documentation follow-up only —
  code already uses the correct values).
- If the Product Owner wants the Objective list to be **end-user editable** at runtime (like the priority
  weights), see `RECOMMENDATIONS` R-06 — currently the list is a code-level enum for validation integrity.

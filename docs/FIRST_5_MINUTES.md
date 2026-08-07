# CreatorOS — The First Five Minutes

**This document is the benchmark for every UX decision.** If a change makes the first five minutes less clear
or more confusing, reconsider it. The goal is a single outcome: by minute five, a brand-new customer thinks
*"I understand exactly what this product does."*

The test for any screen: **"If a creator opened this for the first time, would they immediately know what to do
next?"** If not, simplify.

---

## The ideal first five minutes

### Minute 0 — Arrive
- Open CreatorOS. HOME greets them: **"Welcome to CreatorOS"** with two clear choices —
  **Try Sample Workspace** or **Start Empty Workspace**.
- Creator Mode is on by default: only HOME, TODAY, IDEAS, CONTENT, DASHBOARD are visible. No system sheets,
  no clutter.
- *Supported by:* HOME empty state (`EMPTY_STATES.HOME`), Creator Mode default (WorkspaceService), the menu's
  **Try Sample Workspace** action.

### Minute 1 — See a living product
- Choose **Try Sample Workspace**. In one click, HOME is populated: **Execution Score** front and center,
  today's tasks, upcoming work, a published video, and a recovery example — all for the fictional creator
  "Alex Rivera".
- *Supported by:* `SampleDataService.loadSampleWorkspace()`, `HomeService.render()`.

### Minute 2 — Feel the core promise
- Open **Today**. Complete one sample task. **Refresh Dashboard** — the **Execution Score updates**, and a
  quiet *"✓ Execution Score increased"* appears.
- The creator now understands the core promise: *CreatorOS helps me execute consistently.*
- *Supported by:* TODAY view, `AnalyticsService.executionScore`, `SuccessService.checkExecutionScore`.

### Minute 3 — Meet the intelligence
- Open **AI Review**. See a realistic, plain-language answer to *"Why is my Execution Score what it is?"* and
  a *"realistic-for-your-hours"* weekly plan — working even before any API key (rule-based), better with one.
- *Supported by:* `AiService.analyzePerformance` / `generateWeeklyPlan` (analytics via AnalyticsService),
  the AI Review dialog.

### Minute 4 — See the recovery + calendar story
- The sample includes an overdue task. **Run Recovery** shows *"recover without delaying Friday's video."*
  Push a sample task to **Calendar** (or see it's calendar-ready).
- *Supported by:* `RecoveryService` (Recover → Changed → Sync), `CalendarService`, allocated Scheduled times.

### Minute 5 — The realization
- The creator thinks: **"I understand exactly what this product does — and I want it for my own channel."**
- They click **Start Empty Workspace**, run **Complete Setup**, and add their first real idea via the
  **Add Idea** dialog.

---

## What must always be true (UX guardrails)

1. **HOME leads with Execution Score.** It is the first metric noticed; supporting KPIs stay secondary.
2. **No empty tables without guidance.** Every major screen has a designed empty state.
3. **Every screen answers "what next?"** via a visible primary action.
4. **System complexity stays hidden.** Creator Mode by default; Advanced Workspace is opt-in.
5. **Progress is celebrated subtly.** Success moments encourage without distracting.
6. **The sample workspace is sacred.** It is the fastest path to "I need this" — keep it realistic and one click away.
7. **AI proposes, the creator approves.** Nothing is saved without consent; AI works even when disabled.

## How we measure it
- The **flagship sample-workspace test** (`CX-SAMPLE-001`) proves the minute-1 state is real: populated
  dashboard, Execution Score > 0, a recovery example, published content, approved plan, repurposing — then a
  clean reset.
- The **bound-project walkthrough** (see the milestone QA package) captures the felt five minutes with
  screenshots: first launch → sample → Creator Mode → Add Idea → Create Content → AI Review → HOME.

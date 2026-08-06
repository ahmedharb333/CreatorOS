# src/ui — Presentation layer (dialogs, sidebars, panels)

The **presentation layer** (layer 1, docs 15 §3): custom dialogs, sidebars, and rich panels built with
Apps Script HTML Service, plus the helpers that render user-facing messages. The top-level `Menu.js`
(custom menu) already exists; this folder holds the heavier interactive UI added from Milestone 2 onward.

UI code **calls services** (`src/services/*`) and never touches sheet cells or contains business logic. It
translates `ServiceResult` / `AppError` into clear, non-technical messages (docs 25 §16, NFR-004).

## Intended files (later milestones)

| File | Responsibility | Milestone |
|---|---|---|
| `UiService.js` | Toasts, alerts, confirmations; format `ServiceResult`/`AppError` for users | M2 |
| `DialogService.js` | Modal dialogs: Add Idea, Create Content (5-step), Generate Tasks confirm, Weekly-plan approval, Recovery options, AI review | M2–M5 |
| `SidebarService.js` | Setup wizard sidebar; secure API-key entry (HTML dialog, never a cell) | M2 / M5 |
| `*.html` | HTML Service templates for the above (inlined CSS/JS) | as needed |

## Design rules (docs 25)

- One dominant action per screen; buttons use action verbs; ≤ 7 primary nav items.
- Color semantics: blue = input/primary, gray = calculated/locked, green = done, amber = warning, red = error/overdue/destructive.
- Do not rely on color alone (accessibility); pair with icon/label.
- Secure inputs (API keys) live in HTML dialogs, never in sheet cells.
- Empty states explain the next action; errors state what happened + what to do + a log reference.
- Destructive actions require explicit confirmation (docs 29 §9).

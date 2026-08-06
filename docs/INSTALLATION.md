# CreatorOS — Installation & Verification (Milestone 1)

This installs the Milestone 1 build onto a bound Google Sheet using **clasp**, then verifies it.
(Domain features arrive in later milestones; M1 stands up the workbook, IDs, config and repositories.)

## Prerequisites

- Node.js (for clasp and the pure-logic tests) and `@google/clasp`:
  ```bash
  npm install -g @google/clasp
  clasp login
  ```
- A Google account with permission to create Sheets and Apps Script projects.

## 1. Create the bound project

1. Create a new **Google Sheet** (this becomes the CreatorOS workbook).
2. **Extensions ▸ Apps Script** to open the bound script.
3. **Project Settings ▸** copy the **Script ID**.

## 2. Point clasp at it

Edit `.clasp.json` in the package root and replace the placeholder:

```json
{ "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE", "rootDir": ".", "fileExtension": "js" }
```

## 3. Push the source

From the package root:

```bash
clasp push
```

`.claspignore` ensures only `src/**`, `tests/**` and `appsscript.json` are pushed (no docs/secrets).
Do **not** develop in the online editor except for emergency hotfixes.

## 4. Initialize the workbook

1. Reload the Google Sheet — the **CreatorOS** menu appears.
2. **CreatorOS ▸ Initialize / Repair Workbook** — builds all 16 sheets, validations, protections, named
   ranges; loads the 8 default workflows; sets version markers. Safe to re-run (idempotent, never deletes data).

## 5. Verify

1. **CreatorOS ▸ Verify Schema** → expect **"Schema OK"**.
2. **CreatorOS ▸ Run Tests** → expect all Schema/Id/Validation/Repository cases green.
3. Paste the test summary into `docs/TEST_RESULTS.md §5` (closes KNOWN_ISSUES I-01).

Run the suites locally (no Google needed) — the same code the on-Google run executes:

```bash
node tests/node/pure_tests.js        # pure-logic: expect 34 passed, 0 failed
node tests/node/run_gas_suites.js    # GAS suites via mock: expect 24 passed, 0 failed
```

## 6. Permissions requested (Milestone 1)

Only the minimum:

- `spreadsheets.currentonly` — read/write this workbook.
- `script.container.ui` — menu and dialogs.

Calendar, external-request (AI) and email scopes are **not** requested at this milestone; they are added by
the milestones that use them (staged authorization, docs 29 §3).

## 7. Producing a shareable workbook artifact

A bound Apps Script product has no standalone `.xlsx`. After step 4, use **File ▸ Make a copy** (share the
copy) or **File ▸ Download** to produce a distributable workbook. See `release/WORKBOOK_ARTIFACT.md`.

## Troubleshooting

- **No CreatorOS menu:** reload the Sheet; ensure `clasp push` succeeded and `onOpen` exists.
- **"Schema issues" alert:** re-run Initialize / Repair; the alert lists the exact sheet/header/named-range.
- **Authorization prompt:** expected on first run; grant the two requested scopes.

# CreatorOS — Workbook Artifact Note

**There is no static `.xlsx` in this package, by design.**

CreatorOS is a **bound Apps Script product**: the workbook (all 16 sheets, validations, protections, named
ranges, seeded CONFIG/SETUP/CHANGELOG, and the 8-workflow library) is **generated at runtime** on the
customer's own Google Sheet by **CreatorOS ▸ Initialize / Repair Workbook** after `clasp push`. Shipping a
pre-built binary would (a) not carry the Apps Script code, (b) risk baking in a prior user's data/secrets
(forbidden, docs 22 §4), and (c) drift from the code-generated schema.

## How to produce a shareable workbook artifact

1. Follow `docs/INSTALLATION.md` steps 1–4 (create bound Sheet → `clasp push` → Initialize / Repair).
2. **CreatorOS ▸ Verify Schema** → "Schema OK".
3. **File ▸ Make a copy** (to share a live copy) or **File ▸ Download ▸ Microsoft Excel (.xlsx)** /
   **PDF** to export a static snapshot for review.
4. A copied workbook re-initializes cleanly for a new user and carries **no** prior secrets or calendar IDs
   (portability requirement NFR-006 / docs 22 §4).

## What the generated workbook contains after init

- 16 tabs in canonical order (see `release/manifest.json`).
- Header rows styled + frozen; ID/formula/log/config ranges protected (warning-only).
- CONFIG seeded with priority weights, capacity thresholds, defaults; named ranges `CFG_*` resolved.
- SETUP seeded with the setting definitions; CHANGELOG seeded with the 1.0.0 row.
- WORKFLOWS seeded with 8 workflows / 74 steps.
- Version markers set: PRODUCT_VERSION `1.0.0`, SCHEMA_VERSION `1`.

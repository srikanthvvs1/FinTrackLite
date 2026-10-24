# FinTrack Lite — Reimplementation Prompt Pack

This is a **clean Google Apps Script web-app reimplementation**. It deliberately replaces the complicated investment/valuation/ledger product model with a small personal money-allocation tracker. It preserves the proven Expenses experience and its visual language.

## How to use this pack

1. Work in the order below. Complete, test, and commit one prompt before starting the next.
2. Before every prompt, read `00_SHARED_IMPLEMENTATION_CONTRACT.md`, `000_LITE_ARCHITECTURE_REFERENCE.md`, `001_GUI_REFERENCE.md`, and `002_EXECUTABLE_VALIDATION_PROTOCOL.md` in full.
3. Do not read the old prompt pack as a product requirement. `FinTrack_Implementation_Prompts/` and the current source tree are reference material only, primarily for the Expenses flow and GUI style.
4. No prompt author may add a feature that is not expressly specified here. Where a detail is not listed, use the explicit defaults in the shared contract; do not invent a workflow.
5. This is a Google Apps Script HTML Service application backed by one Google Spreadsheet. Do not introduce a server, npm runtime, database, framework, build step, API key, or external market-data request.

## Prompt order

| Prompt | Deliverable |
|---|---|
| `01_FOUNDATION_AND_FIXED_SCHEMA.md` | GAS project structure, exactly six sheets, settings, seed data, idempotent initialization |
| `02_ACCOUNTS_AND_MOVEMENTS.md` | Lightweight accounts, opening balances, add/withdraw/move actions, derived balances |
| `03_EXPENSES_MODULE.md` | Retained fast expense module, reports, category chart, edit and void |
| `04_REPORTS_DASHBOARD_AND_ACTIVITY.md` | Dashboard, account page, activity list, all report calculations |
| `05_CLIENT_UI_AND_RESPONSIVE_BEHAVIOUR.md` | Exact visual system, dialogs, all screens, desktop/tablet/mobile behaviour |
| `06_TESTS_LOCAL_PREVIEW_AND_FINAL_REVIEW.md` | In-memory tests, UI-preview checks, clasp exclusions, final acceptance matrix |

`002_EXECUTABLE_VALIDATION_PROTOCOL.md` is compulsory for every prompt: it requires a real browser session, a deterministic five-month dummy-money stimulus, account reconciliation, chart/tooltip/axis inspection, and responsive screenshots. It is not optional QA advice.

## Explicit product boundary

FinTrack Lite records where money is allocated. It is not an accounting package, brokerage portfolio, valuation tracker, or bank synchronisation system. “Investment” and “Fund” accounts are balance buckets only. They do not have units, NAV, price, current market value, cost basis, gains, sales, provider mapping, recurring schedules, or a separate valuation page.

## Completion gate

The reimplementation is complete only when `runAllTests()` passes, the responsive preview passes, all six sheet headers match exactly, and the final review in Prompt 06 is PASS in every row.

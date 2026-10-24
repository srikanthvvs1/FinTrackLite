# Prompt 03 executable validation — PASS

Scope: Simple Expenses only. Prompt 04 has not been started. No deployment or clasp push was performed. All stimulus used an isolated in-memory preview frozen at 2026-05-31. No production spreadsheet was accessed.

## Changed files

Production: Code.gs (four expense wrappers); ExpenseService.gs (new expense create/edit/void and eligible/default source helpers); ReportService.gs (new expense report only); Client.html (chooser, expense forms, filters, chart, edit/void, view navigation and refresh); Index.html (expense page/dialogs and Chart include); Styles.html (expense layouts and responsive cards); Chart.html (bundled Chart.js 4.4.8, no runtime CDN request); Validation.gs (fix impossible calendar dates accepted by the shared validator).

Tests/tooling: TestHarness.gs (two expense suites); local-preview/server.js (real expense APIs replace former preview-only expense route/form; fixture survives running tests); local-preview/test.js; local-preview/reconcile03.js; README.md; this report and local evidence/screenshots. Existing .claspignore already excludes TestHarness.gs, local-preview/ and screenshots/.

The repository did not contain a Chart.js bundle. Chart.html supplies the specified Chart.js library rather than introducing a different chart library. No account/movement service implementation was changed. The shared date defect is the only change to Prompt 2 server behavior.

## Commands and results

- `node local-preview/server.js` -> `FinTrack Prompt 03 preview http://127.0.0.1:4173`
- `node local-preview/test.js` invokes runAllTests() with Apps Script memory adapters -> **16 passed, 0 failed**, including all 14 prior tests. Exact output: prompt03-tests.json.
- `node local-preview/reconcile03.js` reads /state and getExpenseReport -> **PASS**. Exact observed-versus-expected results: prompt03-reconciliation.json. GUI-created rows: prompt03-final-state.json.
- All .gs files and Client.html parse with Node vm.Script -> PASS.

## Visible GUI actions performed

Created Fixed Deposit, Emergency, Travel and Chit through Create account, each opening at zero on 2026-01-01. Used header + Add Entry, chooser, visible money-action form, and production Expense form for every row below. Transaction date was the 15th of each month; paired actions and void checks used 2026-05-31.

| Month | Entered through visible forms |
|---|---|
| January | Income 100000 to Cash; moves 30000 to Expenses, 20000 to Mutual Funds, 5000 to Emergency; Housing expense 10000 and Grocery expense 5000 from Expenses. |
| February | Income 100000 to Cash; moves 30000 to Expenses, 15000 to Stocks, 5000 to Travel; Housing 10000 and Grocery 8000 from Expenses. |
| March | Income 100000 to Cash; moves 30000 to Expenses, 10000 to PPF, 5000 to NPS, 5000 to Gold, 5000 to Chit; Housing 12000 and Utilities 6000 from Expenses. |
| April | Income 100000 to Cash; moves 25000 to Expenses, 15000 to Fixed Deposit; Add 1000 Emergency; Withdraw 1000 Travel; Housing 10000 and Travel 4000 from Expenses. |
| May | Income 100000 to Cash; moves 20000 to Expenses, 10000 to Mutual Funds, 5000 to Chit; Housing 10000 and Personal Care 2000 from Expenses. |

Added 100 and withdrew 100 through visible forms for each of the 11 active accounts. Added 250 to Fixed Deposit, selected its Recent activity row, clicked Void and confirmed. Its balance returned from 15250 to 15000.

Validated Expense form defaults: date 2026-05-31, source Expenses, blank required category, eligible source choices only Cash / Salary and Expenses. Housing auto-filled FIXED; Grocery, Utilities, Travel, Personal Care and Wife Expenses auto-filled VARIABLE. Nature remained editable. Chooser contained exactly the five specified choices.

Applied date ranges for each month, full January-May range, all 15 categories individually, FIXED and VARIABLE, both eligible account filters, and combined Housing/VARIABLE/Expenses (zero). Clear restored May defaults. Exact visible summary strings are in gui-filter-observations.json.

Edited May Personal Care from Expenses/2000 to Cash/2500. Observed May total 12500 (expected 12500); read-model balances Cash 262500 and Expenses 60000 (both exact). Restored Expenses/2000 through Edit. Added disposable Other expense 100 with description Disposable void check; May total 12100. Opened Void, cancelled (12100 remained), opened again and confirmed (12000 restored). Regular Expenses hid the void row. Account Recent activity retained it with Void and zero effect. Expenses balance returned to 58000.

Submitted Wife Expenses 999999 from Expenses. The form stayed open and showed the role=alert error: Expenses would have a negative balance of -₹9,41,999. Save was re-enabled. No expense/audit row was written.

## Observed versus expected

Every row below is PASS; values are INR.

| Account | Expected | Observed |
|---|---:|---:|
| Cash / Salary | 265000 | 265000 |
| Expenses | 58000 | 58000 |
| Mutual Funds | 30000 | 30000 |
| Stocks | 15000 | 15000 |
| PPF | 10000 | 10000 |
| NPS | 5000 | 5000 |
| Gold | 5000 | 5000 |
| Fixed Deposit | 15000 | 15000 |
| Emergency | 6000 | 6000 |
| Travel | 4000 | 4000 |
| Chit | 10000 | 10000 |
| Cash group | 265000 | 265000 |
| Expense group | 58000 | 58000 |
| Investment group | 80000 | 80000 |
| Fund group | 20000 | 20000 |
| Total tracked | 423000 | 423000 |

| Month | Expected expenses | Observed expenses |
|---|---:|---:|
| Jan | 15000 | 15000 |
| Feb | 18000 | 18000 |
| Mar | 18000 | 18000 |
| Apr | 14000 | 14000 |
| May | 12000 | 12000 |
| All five | 77000 | 77000 |

Full-range fixed/variable totals: 52000/25000; count 10. Category totals: Housing 52000, Grocery 13000, Utilities 6000, Travel 4000, Personal Care 2000, remaining categories zero. Investment/fund moves never contributed to category spending.

## Chart and responsive evidence

PASS: May doughnut centre 12000, exactly two nonzero slices, legend Housing 10000 / 83.33% and Personal Care 2000 / 16.67%. Tapped each actual rendered slice; visible Chart.js tooltips displayed the same INR values and percentages. No x/y axes or axis labels appeared. Zero categories produced no slices/legend rows. Empty filtered reports displayed text and hid the canvas.

PASS: desktop compact table; mobile stacked cards with Edit/Void reachable. Final screenshots visually inspected at every required width. No page-wide horizontal overflow: clientWidth/scrollWidth were 1425/1425 at viewport 1440, 753/753 at 768, 375/375 at 390, 305/305 at 320 (scrollbar accounts for 15px). Chart and legend fit within panels. Bottom navigation is fixed; page scroll exposes all content and actions.

Screenshots (relative to repository root):

- screenshots/prompt03-expenses-1440.jpg
- screenshots/prompt03-expenses-768.jpg
- screenshots/prompt03-expenses-390.jpg
- screenshots/prompt03-expenses-320.jpg
- screenshots/prompt03-tooltip-housing.jpg
- screenshots/prompt03-tooltip-personal-care.jpg
- screenshots/prompt03-empty.jpg
- screenshots/prompt03-void-confirm.jpg
- screenshots/prompt03-account-sync.jpg
- screenshots/prompt03-insufficient-funds.jpg

Monthly dashboard charts, grouped balance chart, global Activity page and other Prompt 04 functionality remain deliberately deferred. Their underlying account balances were reconciled, but no new report/dashboard UI was built. Validation is local, not a live GAS deployment. No open Prompt 03 failure remains.

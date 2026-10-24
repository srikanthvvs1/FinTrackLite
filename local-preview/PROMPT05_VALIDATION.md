# Prompt 05 validation — PASS

Validated in the isolated local HTML preview with date frozen at `2026-05-31`. No production spreadsheet, deployment, or `clasp push` was used. Prompt 06 was not started.

## Files changed

- `Index.html`: mobile viewport tag, one native dialog with chooser, account, movement, expense, and confirmation panels; semantic Expenses heading and chart descriptions.
- `Client.html`: panel switching within the shared dialog, required markers, move destination filtering, accessible chart summaries, consistent expense dates, and preserved desktop account-list scroll position.
- `Styles.html`: scrollable dialog body, responsive numeric/card text, touch layout, and screen-reader-only summaries.
- `local-preview/test05.js`, `validate05.js`, `inspect05.js`, `touch05.js`: Prompt 5 test and browser validation scripts. `prompt05-*.json` and `screenshots/prompt05-*.png` are isolated evidence excluded by the `.claspignore` production allowlist.

## Commands and results

```powershell
node local-preview/test05.js
# {"passed":20,"failed":0,"total":20}
node local-preview/test-spreadsheet.js
# PASS: explicit spreadsheet ID, execution cache, and isolated test override
$env:FINTRACK_PREVIEW_PORT='4177'; node local-preview/server.js
# http://127.0.0.1:4177
$env:FINTRACK_PREVIEW_URL='http://127.0.0.1:4177'; node local-preview/validate05.js
# {"status":"PASS","checks":130,"GUIActions":176,"tooltips":31,"screenshots":67,"pagination":{"first":100,"total":134}}
$env:FINTRACK_PREVIEW_URL='http://127.0.0.1:4177'; node local-preview/inspect05.js
# {"status":"PASS","actions":17,"checks":229,"screenshots":53}
$env:FINTRACK_PREVIEW_URL='http://127.0.0.1:4177'; node local-preview/touch05.js
# {"status":"PASS","checks":43,"tapTooltips":18,"screenshots":28}
```

The additional UI pass created 15 zero-opening custom Investment/Fund accounts and a zero-opening Delete candidate through the visible account dialog, then soft-deleted the candidate. It checked keyboard focus for every dialog. Earlier attempts corrected browser-script waits, automatic scrolling, and fixture reuse; their failures did not expose a product defect. Client syntax, the single native dialog count, and `git diff --check` passed.

## GUI actions

All five-month financial rows were entered by real click, select, fill, and submit actions in headless Microsoft Edge. The complete ordered list of 176 inputs is in `prompt05-browser-evidence.json`.

| Month | Actions through visible forms |
|---|---|
| Jan 2026 | ₹100,000 income; ₹30,000 move to Expenses, ₹20,000 to Mutual Funds, ₹5,000 to Emergency; ₹10,000 Housing and ₹5,000 Grocery expenses. |
| Feb 2026 | ₹100,000 income; ₹30,000 to Expenses, ₹15,000 to Stocks, ₹5,000 to Travel; ₹10,000 Housing and ₹8,000 Grocery expenses. |
| Mar 2026 | ₹100,000 income; ₹30,000 to Expenses, ₹10,000 to PPF, ₹5,000 each to NPS, Gold, and Chit; ₹12,000 Housing and ₹6,000 Utilities expenses. |
| Apr 2026 | ₹100,000 income; ₹25,000 to Expenses, ₹15,000 to Fixed Deposit; ₹1,000 add to Emergency, ₹1,000 withdraw from Travel; ₹10,000 Housing and ₹4,000 Travel expenses. |
| May 2026 | ₹100,000 income; ₹20,000 to Expenses, ₹10,000 to Mutual Funds, ₹5,000 to Chit; ₹10,000 Housing and ₹2,000 Personal Care expenses. |

Created Fixed Deposit, Emergency, Travel, and Chit via Create account. For each of the 11 active protocol accounts, used visible Add ₹100 and Withdraw ₹100 actions. Added ₹250 to Fixed Deposit and voided it through Activity. Also exercised expense and movement edit/restore, Activity search and pagination, 15 existing investment/fund tile routes, archive confirmation cancellation, and empty chart states. The stress pass used the account form to grow the fixture to 33 accounts and 31 investment/fund tiles, inspected all five views at each width, opened the chooser and each action dialog, checked both delete states, then soft-deleted the zero-balance candidate. Financial totals stayed unchanged.

## Observed versus expected

| Measure | Expected | Observed | Result |
|---|---:|---:|---|
| Cash / Salary | ₹265,000 | ₹265,000 | PASS |
| Expenses | ₹58,000 | ₹58,000 | PASS |
| Mutual Funds | ₹30,000 | ₹30,000 | PASS |
| Stocks | ₹15,000 | ₹15,000 | PASS |
| PPF | ₹10,000 | ₹10,000 | PASS |
| NPS | ₹5,000 | ₹5,000 | PASS |
| Gold | ₹5,000 | ₹5,000 | PASS |
| Fixed Deposit | ₹15,000 | ₹15,000 | PASS |
| Emergency | ₹6,000 | ₹6,000 | PASS |
| Travel | ₹4,000 | ₹4,000 | PASS |
| Chit | ₹10,000 | ₹10,000 | PASS |
| Investments group | ₹80,000 | ₹80,000 | PASS |
| Funds group | ₹20,000 | ₹20,000 | PASS |
| Total tracked balances | ₹423,000 | ₹423,000 | PASS |
| May spending slices | Housing ₹10,000; Personal Care ₹2,000 | Same, 83.33% / 16.67% in legend and tooltip | PASS |
| May income / expenses / net allocation / remainder | ₹100,000 / ₹12,000 / ₹15,000 / ₹73,000 | Same | PASS |
| Jan–May monthly series | `100000/15000/25000/60000`, `100000/18000/20000/62000`, `100000/18000/25000/57000`, `100000/14000/15000/71000`, `100000/12000/15000/73000` | Same in dashboard read-model and chart datasets | PASS |
| Add/withdraw pairs and voided ₹250 | Zero net effect | Zero net effect | PASS |
| Delete nonzero / zero account | Disabled / enabled | Disabled / enabled | PASS |
| Soft-deleted candidate | Hidden, row retained | Hidden, row retained | PASS |

The five-month read-model snapshot is `prompt05-final-state.json`; the post-stress snapshot is `prompt05-ui-final-state.json`. Full observed/expected assertions, chart datasets, tooltip bodies, viewport metrics, and all screenshot paths are in `prompt05-browser-evidence.json`, `prompt05-ui-evidence.json`, and `prompt05-touch-evidence.json`.

## Responsive and chart inspection

At 1440×1000 and 768×1024, the 208px sidebar appears and the 32-account list is sticky, independently scrollable, and keeps the page and list scroll positions when a visible row is selected. At 390×844 and 320×568, the five-item bottom nav appears, Accounts uses document flow, and Expense and Activity rows are stacked cards. All five views passed no horizontal page overflow at all four widths. Actual mobile emulation also confirmed `innerWidth` of 390 and 320, with no page overflow or navigation switch failure. The shared dialog and its primary action remained in the viewport; its content scrolled vertically.

The monthly chart showed chronological `MMM yy` labels, compact INR ticks, a zero baseline, an upper bound above ₹100,000, and full INR hover values. Its 12 labels were skipped by Chart.js when the viewport narrowed. Spending and group doughnuts had no axes, visible centre totals and legends, and hover amounts/percentages. All four charts also responded to 18 real taps in mobile emulation with the expected INR amounts and percentages. The 31-tile grid used responsive cards rather than horizontal scrolling. Empty datasets rendered messages instead of blank canvases.

Representative screenshot paths (the evidence JSON files list all 148):

| View or state | 1440px | 768px | 390px | 320px |
|---|---|---|---|---|
| Dashboard | `screenshots/prompt05-dashboard-1440.png` | `screenshots/prompt05-dashboard-768.png` | `screenshots/prompt05-dashboard-390.png` | `screenshots/prompt05-dashboard-320.png` |
| Expenses | `screenshots/prompt05-expenses-1440.png` | `screenshots/prompt05-expenses-768.png` | `screenshots/prompt05-expenses-390.png` | `screenshots/prompt05-expenses-320.png` |
| Accounts | `screenshots/prompt05-accounts-1440.png` | `screenshots/prompt05-accounts-768.png` | `screenshots/prompt05-accounts-390.png` | `screenshots/prompt05-accounts-320.png` |
| Investments & Funds | `screenshots/prompt05-thirty-tiles-1440.png` | `screenshots/prompt05-thirty-tiles-768.png` | `screenshots/prompt05-thirty-tiles-390.png` | `screenshots/prompt05-thirty-tiles-320.png` |
| Activity | `screenshots/prompt05-activity-1440.png` | `screenshots/prompt05-activity-768.png` | `screenshots/prompt05-activity-390.png` | `screenshots/prompt05-activity-320.png` |
| Move dialog | `screenshots/prompt05-move-1440.png` | `screenshots/prompt05-move-768.png` | `screenshots/prompt05-move-390.png` | `screenshots/prompt05-move-320.png` |
| Delete enabled | `screenshots/prompt05-delete-enabled-1440.png` | `screenshots/prompt05-delete-enabled-768.png` | `screenshots/prompt05-delete-enabled-390.png` | `screenshots/prompt05-delete-enabled-320.png` |

Additional `prompt05-*` screenshots cover the chooser, Income/Add/Withdraw/Expense and account creation dialogs, disabled deletion, account details, mobile cards, every chart tooltip, legends, empty states, and confirmation.
Actual touch examples: `screenshots/prompt05-touch-dashboard-390.png`, `screenshots/prompt05-touch-expenses-320.png`, `screenshots/prompt05-tap-flow-chart-11-320.png`, and `screenshots/prompt05-tap-dashboard-spending-chart-0-390.png`.

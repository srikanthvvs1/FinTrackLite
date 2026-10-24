# Prompt 04 executable validation — PASS

Validated 2026-10-24. Scope: Prompt 04 only. The production database was not opened or modified, and no clasp push, deployment, Git commit, or GitHub push was performed for Prompt 04. The fixture is an isolated in-memory preview with its date frozen at 2026-05-31.

## Implementation and changed files

- Code.gs: public getDashboardData and getActivityPage wrappers, using the existing safe read API pattern.
- ReportService.gs: monthly dashboard cards, 12-month series, category data, current group/account balances, and combined Activity filters with stable cursor pagination. Dashboard reads each of Accounts, Movements, Expenses, ExpenseCategories once; Activity reads each of its three sources once. Reports never write summary data.
- Client.html: connects all five destinations, renders the three dashboard charts, allocation tiles, global Activity, existing edit/void dialogs, two Accounts summary cards, grouped Accounts list, opening information, nonzero Delete restriction and Archive confirmation. Account writes now refresh bootstrap choices; tile routes visibly focus Recent activity. Existing expense form, report, category totals, edit/void semantics, and ExpenseService.gs are preserved.
- Index.html and Styles.html: Prompt 04 page sections and responsive layouts using the established shell and visual tokens. Prompt 05 dialog consolidation and broader UI work were not started.
- TestHarness.gs: four new suites, retaining all 16 existing suites.
- local-preview/server.js and local-preview/test.js: expose the two new report methods in the isolated RPC adapter and save Prompt 04 test output separately.
- local-preview/validate04.js and local-preview/inspect04.js: real Edge/Playwright click, fill, select, submit, hover, pagination, debounce, and tile routing checks.
- README.md, this report, local-preview/prompt04-*.json, and screenshots/prompt04-* evidence.

No valuation, NAV, pricing, units, provider, recurring, market-data, special Chit, or full-ledger features were added. The six-sheet schema is unchanged. Private service IDs remain in Git-ignored local files; the Git-visible working files were scanned and contain none of the real local IDs. .claspignore still permits only the production file allowlist, including ignored PrivateConfig.gs for Apps Script runtime use, and excludes TestHarness.gs, local-preview, screenshots, and template files.

## Commands and exact results

```powershell
node local-preview/test.js
# 20 passed, 0 failed, 20 total
node local-preview/test-spreadsheet.js
# PASS: explicit spreadsheet ID, execution cache, and isolated test override
$env:FINTRACK_PREVIEW_PORT='4176'; node local-preview/server.js
# FinTrack Prompt 04 preview http://127.0.0.1:4176
$env:FINTRACK_PREVIEW_URL='http://127.0.0.1:4176'; node local-preview/validate04.js
# Real GUI stimulus; start with a fresh empty fixture for a new full run.
$env:FINTRACK_CAPTURE_ONLY='1'; node local-preview/validate04.js
# Repeated the complete responsive/tooltip phase on the same reconciled fixture.
# {"status":"PASS","checks":144,"GUIActions":176,"tooltips":31,"screenshots":67,"pagination":{"first":100,"total":134}}
node local-preview/inspect04.js
# {"descriptionDebounce":{"requests":1,"elapsedMs":341,"minimumMs":300,"status":"PASS"},"accountSelection":{"beforeScrollY":250,"afterScrollY":250,"status":"PASS"},"tileRoutes":60,"status":"PASS"}
```

All .gs files and Client.html parse successfully with Node vm.Script. git diff --check passes. Original Prompt 03 evidence is preserved. Test suite output is in prompt04-tests.json; every browser assertion, full GUI input record, chart tooltip, responsive metric and screenshot filename is in prompt04-browser-evidence.json. Read-model reconciliation is in prompt04-final-state.json. Additional interaction results are in prompt04-interaction-evidence.json.

## GUI actions performed

Opened the rendered application in headless Microsoft Edge, using real Playwright UI input. Checked the initially empty dashboard. Created Fixed Deposit, Emergency, Travel and Chit through Create account, each with zero opening balance on 2026-01-01. Used visible Add Entry and the production movement/expense dialogs for the exact protocol:

| Month | GUI entries (all dated the 15th) |
|---|---|
| January | Income 100000 to Cash / Salary; moves 30000 to Expenses, 20000 to Mutual Funds, 5000 to Emergency; Housing expense 10000 and Grocery 5000 from Expenses. |
| February | Income 100000; moves 30000 to Expenses, 15000 to Stocks, 5000 to Travel; Housing 10000 and Grocery 8000 from Expenses. |
| March | Income 100000; moves 30000 to Expenses, 10000 to PPF, 5000 to NPS, 5000 to Gold, 5000 to Chit; Housing 12000 and Utilities 6000 from Expenses. |
| April | Income 100000; moves 25000 to Expenses, 15000 to Fixed Deposit; Add 1000 Emergency; Withdraw 1000 Travel; Housing 10000 and Travel 4000 from Expenses. |
| May | Income 100000; moves 20000 to Expenses, 10000 to Mutual Funds, 5000 to Chit; Housing 10000 and Personal Care 2000 from Expenses. |

For each of the 11 active protocol accounts, selected the account and used Add amount 100 and Withdraw 100 on 2026-05-31. Added 250 to Fixed Deposit through Add Entry, found its row with the visible Activity search, clicked Void and confirmed. Its temporary balance 15250 returned to 15000.

Created zero-balance Home, Vehicle, Education, Future Expense, Custom Investment and Custom Fund accounts solely to exercise every specified tile type. All 15 investment/fund tiles routed to the matching account; a further pass repeated every tile at every required width (60 routes), asserting the Recent activity title was focused and visible beneath the header and above the mobile navigation.

Activity checks: current-month Active default; January date range; all five kind filters; Cash account move-out signs; Void status; case-insensitive description search; unmatched empty state; and Clear. May counts before pagination probes: Income 1, Added amount 11, Withdrawn amount 11, Expense 2. January count was 6. The original voided Fixed Deposit row showed a zero effect, original recorded amount 250, and no Edit/Void actions.

Edited May Personal Care through global Activity from Expenses/2000 to Cash / Salary/2500; Cash became 262500. Restored Expenses/2000 and the original balances. Added a disposable Cash movement 10, edited it to 20, verified +20 in Activity, then voided it. Added 105 entries of 1 to Cash through 105 visible Add Entry dialogs and withdrew 105 through the same dialog flow. These additional probes have zero final external effect. Activity showed the first 100 of 134 active May rows, Load older appended the remaining 34, with no duplicate IDs. Accounts Recent activity also loaded 100 followed by older rows.

Checked nonzero Delete is disabled with the precise remaining balance, inspected the Archive retained-history confirmation and cancelled it, and checked the account opening information. Desktop list overflow is auto with the required bounded height. Selecting an account did not move the page: scrollY remained 250. Description search generated no request before 150 ms and one request after the 300 ms debounce (observed 341 ms).

## Account reconciliation

| Account / group | Expected | Observed | Result |
|---|---:|---:|---|
| Cash / Salary | ₹2,65,000.00 | ₹2,65,000.00 | PASS |
| Expenses | ₹58,000.00 | ₹58,000.00 | PASS |
| Mutual Funds | ₹30,000.00 | ₹30,000.00 | PASS |
| Stocks | ₹15,000.00 | ₹15,000.00 | PASS |
| PPF | ₹10,000.00 | ₹10,000.00 | PASS |
| NPS | ₹5,000.00 | ₹5,000.00 | PASS |
| Gold | ₹5,000.00 | ₹5,000.00 | PASS |
| Fixed Deposit | ₹15,000.00 | ₹15,000.00 | PASS |
| Emergency | ₹6,000.00 | ₹6,000.00 | PASS |
| Travel | ₹4,000.00 | ₹4,000.00 | PASS |
| Chit | ₹10,000.00 | ₹10,000.00 | PASS |
| Cash group | ₹2,65,000.00 | ₹2,65,000.00 | PASS |
| Expense group | ₹58,000.00 | ₹58,000.00 | PASS |
| Investment group | ₹80,000.00 | ₹80,000.00 | PASS |
| Fund group | ₹20,000.00 | ₹20,000.00 | PASS |
| Total tracked balances | ₹4,23,000.00 | ₹4,23,000.00 | PASS |

All balances are nonnegative. The six additional type-coverage accounts each remain zero. Total reconciliation: Income 500000 + net active external Add/Withdraw 0 - Expenses 77000 = 423000. Moves are counted once. The final fixture has 17 accounts, 153 movements and 10 expenses. Two disposable movements are Void, both with zero effect.

## Monthly dashboard and chart reconciliation

May visible card order and values: Income 100000; Expenses 12000; Net allocated to investments & funds 15000; Salary allocation remainder 73000. April picker showed 100000 / 14000 / 15000 / 71000. December 2025 showed an intentional empty spending state.

| Month | Income observed / expected | Expenses observed / expected | Net allocated observed / expected | Remainder observed / expected | Result |
|---|---:|---:|---:|---:|---|
| Jan 26 | 100000 / 100000 | 15000 / 15000 | 25000 / 25000 | 60000 / 60000 | PASS |
| Feb 26 | 100000 / 100000 | 18000 / 18000 | 20000 / 20000 | 62000 / 62000 | PASS |
| Mar 26 | 100000 / 100000 | 18000 / 18000 | 25000 / 25000 | 57000 / 57000 | PASS |
| Apr 26 | 100000 / 100000 | 14000 / 14000 | 15000 / 15000 | 71000 / 71000 | PASS |
| May 26 | 100000 / 100000 | 12000 / 12000 | 15000 / 15000 | 73000 / 73000 | PASS |

The independent expected table is asserted in validate04.js and TestHarness.gs. Every June–December 2025 value is zero and the full 12-month window remains present. Tooltip inspection covered January through May, each tooltip showing the four full INR amounts. Chart x labels are chronological MMM yy and automatically skip at narrower widths; y labels use compact INR, with baseline 0 and upper bound 150000 above the largest value 100000. The bars are Income, Expenses, Net allocated; the line is Salary allocation remainder.

May spending contains exactly Housing 10000 / 83.33% and Personal Care 2000 / 16.67%, total 12000. Both dashboard and retained Expenses doughnuts have no x/y scales, show centre totals and legends, and expose correct amount/percentage tooltips. Zero categories create no slices. The group doughnut has precisely the four nonzero group values 265000, 58000, 80000, 20000; centre total 423000. Hovered each group and both category slices, plus all relevant historical flow points. Empty flow/spending/group states were checked before input.

Unit-only boundary cases additionally cover split salary entries, internal investment-to-fund moves cancelling, outward allocations subtracting, external Add/Withdraw exclusion from allocation, opening balances excluded from monthly cards, archived history, deleted account exclusion, stable date/timestamp/entity/ID ordering, invalid report requests, live recalculation and one bulk source read per request.

## Responsive and visual evidence

All five screens were navigated at 1440x1000, 768x1024, 390x844 and 320x568. Desktop/tablet tables and mobile stacked cards were inspected. Sidebar/bottom navigation, labels, numeric values, chart legends, axes, tooltip positions, and reachable Edit/Void controls were reviewed in screenshots. Horizontal document overflow is zero for every view/width. Activity may use its permitted table wrapper scroll at intermediate widths. Additional screenshots show the scrolled account detail, expense rows and Activity rows on each viewport.

| View | Width | Client width | Scroll width | Result |
|---|---:|---:|---:|---|
| dashboard | 1440 | 1440 | 1440 | PASS |
| expenses | 1440 | 1440 | 1440 | PASS |
| accounts | 1440 | 1440 | 1440 | PASS |
| allocations | 1440 | 1440 | 1440 | PASS |
| activity | 1440 | 1440 | 1440 | PASS |
| dashboard | 768 | 768 | 768 | PASS |
| expenses | 768 | 768 | 768 | PASS |
| accounts | 768 | 768 | 768 | PASS |
| allocations | 768 | 768 | 768 | PASS |
| activity | 768 | 768 | 768 | PASS |
| dashboard | 390 | 390 | 390 | PASS |
| expenses | 390 | 390 | 390 | PASS |
| accounts | 390 | 390 | 390 | PASS |
| allocations | 390 | 390 | 390 | PASS |
| activity | 390 | 390 | 390 | PASS |
| dashboard | 320 | 320 | 320 | PASS |
| expenses | 320 | 320 | 320 | PASS |
| accounts | 320 | 320 | 320 | PASS |
| allocations | 320 | 320 | 320 | PASS |
| activity | 320 | 320 | 320 | PASS |

Full-page captures retain the fixed navigation at its real viewport position; scroll-focused tooltip/list captures show the lower content separately.

## Resolved validation failures

An initial screenshot batch caught charts during their default animation. Captures were repeated after waiting for completed animation. A mobile Expense tooltip check then failed because the automation pointer landed behind the fixed bottom navigation. No application data defect was involved: the harness now centers each canvas in the unobscured viewport before issuing a real mouse hover. All responsive captures and all visible-chart tooltip checks were repeated on the same reconciled five-month fixture and passed. Diagnostic screenshot of the resolved pointer failure: ../screenshots/prompt04-failure.png. No unresolved value, chart, tooltip, layout, pagination or runtime failure remains.

## Screenshot inventory

- ../screenshots/prompt04-empty-dashboard.png
- ../screenshots/prompt04-void-confirmation.png
- ../screenshots/prompt04-flow-tooltip-Jan-26.png
- ../screenshots/prompt04-flow-tooltip-Feb-26.png
- ../screenshots/prompt04-flow-tooltip-Mar-26.png
- ../screenshots/prompt04-flow-tooltip-Apr-26.png
- ../screenshots/prompt04-flow-tooltip-May-26.png
- ../screenshots/prompt04-spending-tooltip-0.png
- ../screenshots/prompt04-spending-tooltip-1.png
- ../screenshots/prompt04-group-tooltip-0.png
- ../screenshots/prompt04-group-tooltip-1.png
- ../screenshots/prompt04-group-tooltip-2.png
- ../screenshots/prompt04-group-tooltip-3.png
- ../screenshots/prompt04-empty-selected-month.png
- ../screenshots/prompt04-activity-void.png
- ../screenshots/prompt04-dashboard-1440.png
- ../screenshots/prompt04-flow-tooltip-May-1440.png
- ../screenshots/prompt04-spending-tooltip-1440.png
- ../screenshots/prompt04-group-tooltip-1440.png
- ../screenshots/prompt04-expenses-1440.png
- ../screenshots/prompt04-expense-tooltip-housing-1440.png
- ../screenshots/prompt04-expense-tooltip-personal-1440.png
- ../screenshots/prompt04-expense-list-1440.png
- ../screenshots/prompt04-accounts-1440.png
- ../screenshots/prompt04-account-detail-1440.png
- ../screenshots/prompt04-allocations-1440.png
- ../screenshots/prompt04-activity-1440.png
- ../screenshots/prompt04-activity-list-1440.png
- ../screenshots/prompt04-dashboard-768.png
- ../screenshots/prompt04-flow-tooltip-May-768.png
- ../screenshots/prompt04-spending-tooltip-768.png
- ../screenshots/prompt04-group-tooltip-768.png
- ../screenshots/prompt04-expenses-768.png
- ../screenshots/prompt04-expense-tooltip-housing-768.png
- ../screenshots/prompt04-expense-tooltip-personal-768.png
- ../screenshots/prompt04-expense-list-768.png
- ../screenshots/prompt04-accounts-768.png
- ../screenshots/prompt04-account-detail-768.png
- ../screenshots/prompt04-allocations-768.png
- ../screenshots/prompt04-activity-768.png
- ../screenshots/prompt04-activity-list-768.png
- ../screenshots/prompt04-dashboard-390.png
- ../screenshots/prompt04-flow-tooltip-May-390.png
- ../screenshots/prompt04-spending-tooltip-390.png
- ../screenshots/prompt04-group-tooltip-390.png
- ../screenshots/prompt04-expenses-390.png
- ../screenshots/prompt04-expense-tooltip-housing-390.png
- ../screenshots/prompt04-expense-tooltip-personal-390.png
- ../screenshots/prompt04-expense-list-390.png
- ../screenshots/prompt04-accounts-390.png
- ../screenshots/prompt04-account-detail-390.png
- ../screenshots/prompt04-allocations-390.png
- ../screenshots/prompt04-activity-390.png
- ../screenshots/prompt04-activity-list-390.png
- ../screenshots/prompt04-dashboard-320.png
- ../screenshots/prompt04-flow-tooltip-May-320.png
- ../screenshots/prompt04-spending-tooltip-320.png
- ../screenshots/prompt04-group-tooltip-320.png
- ../screenshots/prompt04-expenses-320.png
- ../screenshots/prompt04-expense-tooltip-housing-320.png
- ../screenshots/prompt04-expense-tooltip-personal-320.png
- ../screenshots/prompt04-expense-list-320.png
- ../screenshots/prompt04-accounts-320.png
- ../screenshots/prompt04-account-detail-320.png
- ../screenshots/prompt04-allocations-320.png
- ../screenshots/prompt04-activity-320.png
- ../screenshots/prompt04-activity-list-320.png

Review contact sheets (derived only from the final captured screenshots):

- ../screenshots/prompt04-review-1440.jpg
- ../screenshots/prompt04-review-768.jpg
- ../screenshots/prompt04-review-390.jpg
- ../screenshots/prompt04-review-320.jpg

## Exact GUI input records

These 176 records document monetary and account input. The filter, navigation, chart-hover and routing assertions are retained in the browser/interaction JSON files.

| # | Input |
|---:|---|
| 1 | {"action":"Create account","name":"Fixed Deposit","type":"FIXED_DEPOSIT","group":""} |
| 2 | {"action":"Create account","name":"Emergency","type":"EMERGENCY_FUND","group":""} |
| 3 | {"action":"Create account","name":"Travel","type":"TRAVEL_FUND","group":""} |
| 4 | {"action":"Create account","name":"Chit","type":"CHIT","group":""} |
| 5 | {"action":"INCOME","date":"2026-01-15","from":"","to":"Cash / Salary","amount":100000,"description":"Salary 1"} |
| 6 | {"action":"MOVE","date":"2026-01-15","from":"Cash / Salary","to":"Expenses","amount":30000,"description":""} |
| 7 | {"action":"MOVE","date":"2026-01-15","from":"Cash / Salary","to":"Mutual Funds","amount":20000,"description":""} |
| 8 | {"action":"MOVE","date":"2026-01-15","from":"Cash / Salary","to":"Emergency","amount":5000,"description":""} |
| 9 | {"action":"EXPENSE","date":"2026-01-15","category":"housing","amount":10000,"description":"Monthly housing","account":"Expenses"} |
| 10 | {"action":"EXPENSE","date":"2026-01-15","category":"grocery","amount":5000,"description":"Monthly grocery","account":"Expenses"} |
| 11 | {"action":"INCOME","date":"2026-02-15","from":"","to":"Cash / Salary","amount":100000,"description":"Salary 2"} |
| 12 | {"action":"MOVE","date":"2026-02-15","from":"Cash / Salary","to":"Expenses","amount":30000,"description":""} |
| 13 | {"action":"MOVE","date":"2026-02-15","from":"Cash / Salary","to":"Stocks","amount":15000,"description":""} |
| 14 | {"action":"MOVE","date":"2026-02-15","from":"Cash / Salary","to":"Travel","amount":5000,"description":""} |
| 15 | {"action":"EXPENSE","date":"2026-02-15","category":"housing","amount":10000,"description":"Monthly housing","account":"Expenses"} |
| 16 | {"action":"EXPENSE","date":"2026-02-15","category":"grocery","amount":8000,"description":"Monthly grocery","account":"Expenses"} |
| 17 | {"action":"INCOME","date":"2026-03-15","from":"","to":"Cash / Salary","amount":100000,"description":"Salary 3"} |
| 18 | {"action":"MOVE","date":"2026-03-15","from":"Cash / Salary","to":"Expenses","amount":30000,"description":""} |
| 19 | {"action":"MOVE","date":"2026-03-15","from":"Cash / Salary","to":"PPF","amount":10000,"description":""} |
| 20 | {"action":"MOVE","date":"2026-03-15","from":"Cash / Salary","to":"NPS","amount":5000,"description":""} |
| 21 | {"action":"MOVE","date":"2026-03-15","from":"Cash / Salary","to":"Gold","amount":5000,"description":""} |
| 22 | {"action":"MOVE","date":"2026-03-15","from":"Cash / Salary","to":"Chit","amount":5000,"description":""} |
| 23 | {"action":"EXPENSE","date":"2026-03-15","category":"housing","amount":12000,"description":"Monthly housing","account":"Expenses"} |
| 24 | {"action":"EXPENSE","date":"2026-03-15","category":"utilities","amount":6000,"description":"Monthly utilities","account":"Expenses"} |
| 25 | {"action":"INCOME","date":"2026-04-15","from":"","to":"Cash / Salary","amount":100000,"description":"Salary 4"} |
| 26 | {"action":"MOVE","date":"2026-04-15","from":"Cash / Salary","to":"Expenses","amount":25000,"description":""} |
| 27 | {"action":"MOVE","date":"2026-04-15","from":"Cash / Salary","to":"Fixed Deposit","amount":15000,"description":""} |
| 28 | {"action":"ADD","date":"2026-04-15","from":"","to":"Emergency","amount":1000,"description":""} |
| 29 | {"action":"WITHDRAW","date":"2026-04-15","from":"Travel","to":"","amount":1000,"description":""} |
| 30 | {"action":"EXPENSE","date":"2026-04-15","category":"housing","amount":10000,"description":"Monthly housing","account":"Expenses"} |
| 31 | {"action":"EXPENSE","date":"2026-04-15","category":"travel","amount":4000,"description":"Monthly travel","account":"Expenses"} |
| 32 | {"action":"INCOME","date":"2026-05-15","from":"","to":"Cash / Salary","amount":100000,"description":"Salary 5"} |
| 33 | {"action":"MOVE","date":"2026-05-15","from":"Cash / Salary","to":"Expenses","amount":20000,"description":""} |
| 34 | {"action":"MOVE","date":"2026-05-15","from":"Cash / Salary","to":"Mutual Funds","amount":10000,"description":""} |
| 35 | {"action":"MOVE","date":"2026-05-15","from":"Cash / Salary","to":"Chit","amount":5000,"description":""} |
| 36 | {"action":"EXPENSE","date":"2026-05-15","category":"housing","amount":10000,"description":"Monthly housing","account":"Expenses"} |
| 37 | {"action":"EXPENSE","date":"2026-05-15","category":"personal_care","amount":2000,"description":"Monthly personal_care","account":"Expenses"} |
| 38 | {"action":"Add amount","date":"2026-05-31","account":"Cash / Salary","amount":100} |
| 39 | {"action":"Withdraw","date":"2026-05-31","account":"Cash / Salary","amount":100} |
| 40 | {"action":"Add amount","date":"2026-05-31","account":"Expenses","amount":100} |
| 41 | {"action":"Withdraw","date":"2026-05-31","account":"Expenses","amount":100} |
| 42 | {"action":"Add amount","date":"2026-05-31","account":"Mutual Funds","amount":100} |
| 43 | {"action":"Withdraw","date":"2026-05-31","account":"Mutual Funds","amount":100} |
| 44 | {"action":"Add amount","date":"2026-05-31","account":"Stocks","amount":100} |
| 45 | {"action":"Withdraw","date":"2026-05-31","account":"Stocks","amount":100} |
| 46 | {"action":"Add amount","date":"2026-05-31","account":"PPF","amount":100} |
| 47 | {"action":"Withdraw","date":"2026-05-31","account":"PPF","amount":100} |
| 48 | {"action":"Add amount","date":"2026-05-31","account":"NPS","amount":100} |
| 49 | {"action":"Withdraw","date":"2026-05-31","account":"NPS","amount":100} |
| 50 | {"action":"Add amount","date":"2026-05-31","account":"Gold","amount":100} |
| 51 | {"action":"Withdraw","date":"2026-05-31","account":"Gold","amount":100} |
| 52 | {"action":"Add amount","date":"2026-05-31","account":"Fixed Deposit","amount":100} |
| 53 | {"action":"Withdraw","date":"2026-05-31","account":"Fixed Deposit","amount":100} |
| 54 | {"action":"Add amount","date":"2026-05-31","account":"Emergency","amount":100} |
| 55 | {"action":"Withdraw","date":"2026-05-31","account":"Emergency","amount":100} |
| 56 | {"action":"Add amount","date":"2026-05-31","account":"Travel","amount":100} |
| 57 | {"action":"Withdraw","date":"2026-05-31","account":"Travel","amount":100} |
| 58 | {"action":"Add amount","date":"2026-05-31","account":"Chit","amount":100} |
| 59 | {"action":"Withdraw","date":"2026-05-31","account":"Chit","amount":100} |
| 60 | {"action":"ADD","date":"2026-05-31","from":"","to":"Fixed Deposit","amount":250,"description":"Disposable void check"} |
| 61 | {"action":"Void","description":"Disposable void check","amount":250} |
| 62 | {"action":"Create account","name":"Home","type":"HOME_FUND","group":""} |
| 63 | {"action":"Create account","name":"Vehicle","type":"VEHICLE_FUND","group":""} |
| 64 | {"action":"Create account","name":"Education","type":"EDUCATION_FUND","group":""} |
| 65 | {"action":"Create account","name":"Future Expense","type":"FUTURE_EXPENSE_FUND","group":""} |
| 66 | {"action":"Create account","name":"Custom Investment","type":"CUSTOM","group":"INVESTMENT"} |
| 67 | {"action":"Create account","name":"Custom Fund","type":"CUSTOM","group":"FUND"} |
| 68 | {"action":"Edit expense and restore","description":"Monthly personal_care"} |
| 69 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":10,"description":"Editable movement"} |
| 70 | {"action":"Edit and void movement","amount":20,"description":"Editable movement"} |
| 71 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 000"} |
| 72 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 001"} |
| 73 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 002"} |
| 74 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 003"} |
| 75 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 004"} |
| 76 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 005"} |
| 77 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 006"} |
| 78 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 007"} |
| 79 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 008"} |
| 80 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 009"} |
| 81 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 010"} |
| 82 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 011"} |
| 83 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 012"} |
| 84 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 013"} |
| 85 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 014"} |
| 86 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 015"} |
| 87 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 016"} |
| 88 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 017"} |
| 89 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 018"} |
| 90 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 019"} |
| 91 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 020"} |
| 92 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 021"} |
| 93 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 022"} |
| 94 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 023"} |
| 95 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 024"} |
| 96 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 025"} |
| 97 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 026"} |
| 98 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 027"} |
| 99 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 028"} |
| 100 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 029"} |
| 101 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 030"} |
| 102 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 031"} |
| 103 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 032"} |
| 104 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 033"} |
| 105 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 034"} |
| 106 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 035"} |
| 107 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 036"} |
| 108 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 037"} |
| 109 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 038"} |
| 110 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 039"} |
| 111 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 040"} |
| 112 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 041"} |
| 113 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 042"} |
| 114 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 043"} |
| 115 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 044"} |
| 116 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 045"} |
| 117 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 046"} |
| 118 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 047"} |
| 119 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 048"} |
| 120 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 049"} |
| 121 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 050"} |
| 122 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 051"} |
| 123 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 052"} |
| 124 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 053"} |
| 125 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 054"} |
| 126 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 055"} |
| 127 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 056"} |
| 128 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 057"} |
| 129 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 058"} |
| 130 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 059"} |
| 131 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 060"} |
| 132 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 061"} |
| 133 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 062"} |
| 134 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 063"} |
| 135 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 064"} |
| 136 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 065"} |
| 137 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 066"} |
| 138 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 067"} |
| 139 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 068"} |
| 140 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 069"} |
| 141 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 070"} |
| 142 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 071"} |
| 143 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 072"} |
| 144 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 073"} |
| 145 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 074"} |
| 146 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 075"} |
| 147 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 076"} |
| 148 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 077"} |
| 149 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 078"} |
| 150 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 079"} |
| 151 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 080"} |
| 152 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 081"} |
| 153 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 082"} |
| 154 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 083"} |
| 155 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 084"} |
| 156 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 085"} |
| 157 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 086"} |
| 158 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 087"} |
| 159 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 088"} |
| 160 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 089"} |
| 161 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 090"} |
| 162 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 091"} |
| 163 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 092"} |
| 164 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 093"} |
| 165 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 094"} |
| 166 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 095"} |
| 167 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 096"} |
| 168 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 097"} |
| 169 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 098"} |
| 170 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 099"} |
| 171 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 100"} |
| 172 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 101"} |
| 173 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 102"} |
| 174 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 103"} |
| 175 | {"action":"ADD","date":"2026-05-31","from":"","to":"Cash / Salary","amount":1,"description":"Pagination probe 104"} |
| 176 | {"action":"WITHDRAW","date":"2026-05-31","from":"Cash / Salary","to":"","amount":105,"description":"Pagination offset"} |

## Deliberately deferred

Prompt 05 and Prompt 06 remain unstarted. No production deployment or Git publishing is part of this Prompt 04 task. The earlier request to replace published Git history remains unapproved and unchanged.

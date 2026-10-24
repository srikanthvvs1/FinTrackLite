# Executable Validation Protocol — Mandatory for Every Prompt

This protocol is a release gate for every prompt in this pack. Passing unit tests or reviewing source code alone is insufficient.

## 1. Required execution surfaces

For the scope completed by a prompt, the implementer must:

1. run the in-memory Apps Script test harness;
2. start the repository’s local FinTrack HTML preview or a non-production Apps Script test deployment;
3. open the rendered application in a browser, interact with visible controls, and capture screenshots; and
4. inspect the spreadsheet rows/read-model returned by the application to reconcile the displayed values.

The browser check must use real click/type/select/submit actions. Do not satisfy it with DOM construction tests, a source review, mocked chart data, or a screenshot of static HTML. Test fixtures, preview-only data, screenshots, and browser-validation scripts must be excluded by `.claspignore` and must never be pushed to Apps Script.

## 2. Deterministic five-month GUI stimulus

Use an isolated local preview fixture or a disposable non-production test spreadsheet. Freeze its test date at `2026-05-31`. Start with the seeded Lite accounts and add `Fixed Deposit`, `Emergency`, `Travel`, and `Chit` through the visible Create account dialog. Record every entry through the visible Quick Add/dialog or page action—not by directly writing fixture rows.

| Month | GUI actions |
|---|---|
| Jan 2026 | Income ₹100,000 to Cash / Salary; move ₹30,000 to Expenses, ₹20,000 to Mutual Funds, ₹5,000 to Emergency; expense ₹10,000 Housing and ₹5,000 Grocery from Expenses. |
| Feb 2026 | Income ₹100,000; move ₹30,000 to Expenses, ₹15,000 to Stocks, ₹5,000 to Travel; expense ₹10,000 Housing and ₹8,000 Grocery from Expenses. |
| Mar 2026 | Income ₹100,000; move ₹30,000 to Expenses, ₹10,000 to PPF, ₹5,000 to NPS, ₹5,000 to Gold, ₹5,000 to Chit; expense ₹12,000 Housing and ₹6,000 Utilities from Expenses. |
| Apr 2026 | Income ₹100,000; move ₹25,000 to Expenses, ₹15,000 to Fixed Deposit; add ₹1,000 to Emergency; withdraw ₹1,000 from Travel; expense ₹10,000 Housing and ₹4,000 Travel from Expenses. |
| May 2026 | Income ₹100,000; move ₹20,000 to Expenses, ₹10,000 to Mutual Funds, ₹5,000 to Chit; expense ₹10,000 Housing and ₹2,000 Personal Care from Expenses. For every active account, Add ₹100 and then Withdraw ₹100 through its visible action. Add ₹250 to Fixed Deposit and Void that added row. |

The paired ₹100 actions prove every account type supports both actions and leave all final balances unchanged. The voided ₹250 must have zero final effect.

## 3. Exact expected reconciliation after May actions

| Group / account | Expected balance |
|---|---:|
| Cash / Salary | ₹265,000 |
| Expenses | ₹58,000 |
| Mutual Funds | ₹30,000 |
| Stocks | ₹15,000 |
| PPF | ₹10,000 |
| NPS | ₹5,000 |
| Gold | ₹5,000 |
| Fixed Deposit | ₹15,000 |
| Emergency | ₹6,000 |
| Travel | ₹4,000 |
| Chit | ₹10,000 |
| Cash group | ₹265,000 |
| Expense group | ₹58,000 |
| Investment group | ₹80,000 |
| Fund group | ₹20,000 |
| Total tracked balances | ₹423,000 |

There must be no negative balance, duplicated balance, or unexplained difference. The total also reconciles to Income ₹500,000 + net external Add/Withdraw ₹0 − Expenses ₹77,000 = ₹423,000. Moves do not change the total.

## 4. Expected monthly dashboard/chart data

| Month | Income | Expenses | Net allocation | Salary allocation remainder |
|---|---:|---:|---:|---:|
| Jan 26 | ₹100,000 | ₹15,000 | ₹25,000 | ₹60,000 |
| Feb 26 | ₹100,000 | ₹18,000 | ₹20,000 | ₹62,000 |
| Mar 26 | ₹100,000 | ₹18,000 | ₹25,000 | ₹57,000 |
| Apr 26 | ₹100,000 | ₹14,000 | ₹15,000 | ₹71,000 |
| May 26 | ₹100,000 | ₹12,000 | ₹15,000 | ₹73,000 |

For the May Spending by category chart, expected values are Housing ₹10,000 and Personal Care ₹2,000, total ₹12,000; all other categories are zero and must not create a visible zero slice. The chart tooltip/legend must expose amount and percentage: Housing ₹10,000 / 83.33%; Personal Care ₹2,000 / 16.67%.

## 5. Chart inspection gate

For each visible chart, inspect its rendered screenshot **and hover/tap tooltips**:

- A doughnut has no x/y axes, shows a centre total, a readable legend, correct amount/percentage, and an intentional empty state when no data exists.
- A monthly chart has chronological, non-overlapping `MMM yy` x-axis labels; y-axis uses compact INR ticks with a zero baseline and an upper bound rounded above the largest visible value. Its hover tooltip gives the full INR amounts and matches the table above.
- The grouped balance chart has only non-zero groups, one value per group, visible labels/tooltips, and totals ₹265,000, ₹58,000, ₹80,000, and ₹20,000.
- At 1440px, 768px, 390px, and 320px, no chart overflows, clips its legend, or has unreadable axes. Take screenshots at all four widths.

## 6. Required evidence and failure policy

Each prompt’s final response must include: test output, invoked preview/test URL or command, screenshots paths, all input actions performed, observed-versus-expected values, and any failed validation. If any value, chart, axis, tooltip, responsive layout, or account activity is wrong, fix it and rerun the entire relevant stimulus. Never claim completion based only on source inspection.

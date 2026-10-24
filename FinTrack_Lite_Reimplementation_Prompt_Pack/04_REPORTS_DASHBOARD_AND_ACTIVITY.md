# Prompt 04 — Dashboard, Accounts, Investments & Funds, and Activity

Read shared references first. All reports are derived from current bulk reads; no summary values are written to Sheets.

## Dashboard

`getDashboardData({month})` defaults to current calendar month and returns these cards in this order:

1. Income
2. Expenses
3. Net allocated to investments & funds
4. Salary allocation remainder

Use definitions from the architecture reference exactly. The heading is `Dashboard`; eyebrow `MONTHLY OVERVIEW`; explanatory copy: `See where this month’s income has gone.` Provide a month picker, not arbitrary start/end dates.

Render exactly three dashboard charts/panels:

1. **Monthly allocation flow**: last 12 calendar months, grouped bars for Income, Expenses, and Net allocated; line for Salary allocation remainder. Zero months stay present. Dates use `MMM yy` and labels are auto-skipped where space is limited.
2. **Spending by category**: current selected month doughnut, following Prompt 03 rules.
3. **Tracked balances by account group**: horizontal bar or doughnut with Cash, Expense, Investment, Fund groups that have non-zero current balance. This is a present balance view, not a time-series or valuation chart.

Include an account-balance summary list grouped Cash, Expense, Investments, Funds. Display balances exactly once; do not total a group and its accounts together.

## Accounts screen

Heading `Accounts`; eyebrow `BUCKETS`; copy `Add, move, or withdraw money without account reconciliation.` Show summary cards for Cash / Expense balances and Investments / Funds balances. Account list is grouped and selectable. Selected account shows Current balance, type, opening balance/date, and Recent activity, whose default range is the current calendar month and which shows 100 rows maximum with Load older. Use the independent desktop list scrolling rule from GUI reference.

Account action buttons are Add amount, Withdraw, Move, Edit, Archive, Delete. Delete is disabled with a precise balance message unless zero. Archive/delete confirmation text must state the retained-history behaviour exactly.

## Investments & Funds screen

Heading exactly `Investments & Funds`; eyebrow `ALLOCATIONS`; copy `Track how much you have allocated — not market value.`

Show two sections, never a separate holding/valuation workflow:

- **Investments**: tiles for Mutual Funds, Stocks, PPF, NPS, Gold, Fixed Deposits, and Custom accounts assigned `INVESTMENT`.
- **Funds**: tiles for Emergency, Travel, Chit, Home, Vehicle, Education, Future Expense, and Custom accounts assigned `FUND`.

Each tile lists account name, account type label, and current tracked balance. Clicking a tile selects that account and routes/open-focuses its Accounts screen Recent activity. Do not render lengthy per-type holding panels. Chit is only a FUND type and supports the same Add/Withdraw/Move actions as every fund; no special contribution, interest, or payout UI exists.

## Activity screen

Heading `Activity`; eyebrow `RECENT CHANGES`; copy `Review income, allocations, withdrawals, and expenses.` Combine Movements and Expenses in one newest-first list. Filter by date range, kind (`Income`, `Added amount`, `Withdrawn amount`, `Moved amount`, `Expense`), account, and status (Active/Void); description search is debounced 300 ms. Default is current month, active, newest first, first 100. Load older uses cursor pagination. Desktop table and mobile card layouts follow GUI reference. Edit/Void actions are available only to active rows and use the existing dialog pattern.

## Required tests

Five-month scenario: Cash/Salary, Expenses, Mutual Fund, Stock, PPF, NPS, Gold, Fixed Deposit, Emergency Fund, Travel Fund, and Chit; multiple salary entries, moves, expenses, additions/withdrawals, and voids. Assert all balances, dashboard card formulas, group totals, expense totals, activity pagination/order, and every chart dataset. Assert no chart or label exposes valuation language.

## Mandatory executable validation gate

Follow `002_EXECUTABLE_VALIDATION_PROTOCOL.md` in full. Navigate through all five rendered views after the complete stimulus. On Dashboard, use the May picker and verify card values ₹100,000, ₹12,000, ₹15,000, and ₹73,000 in order. Hover every May and historical data point needed to prove the exact monthly table, inspect chronological x-axis labels and scaled INR y-axis ticks, then verify group totals and total tracked balance. On Investments & Funds, verify every type tile routes to the matching account rather than an invented holding page. On Activity, verify filters, text search, pagination, active/void display, signed effects, and the voided Fixed Deposit addition. Capture screenshots at desktop/tablet/mobile/small-mobile and fix any mismatch before continuing.

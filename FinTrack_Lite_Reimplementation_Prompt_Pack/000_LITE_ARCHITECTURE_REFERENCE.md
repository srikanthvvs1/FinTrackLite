# FinTrack Lite — Fixed Architecture Reference

## 1. Product goal

Make a personal tracker quick enough to use every month:

1. Record salary/income into Cash / Salary.
2. Move money to Expenses, investment buckets, or short-term fund buckets.
3. Record individual expenses against Cash / Salary or Expenses.
4. See monthly income, spending, allocations, remaining salary allocation, and current bucket balances.

The system records a concise activity history so balances can be recalculated. It must never expose that implementation as a full accounting ledger or require the user to reconcile accounts.

## 2. Technology and deployment

- Google Apps Script, V8 runtime, Google Spreadsheet persistence, HTML Service web app.
- Source is `.gs`, `.html`, `appsscript.json`, tests, and local-preview tooling only.
- Client calls use `google.script.run` through one promise wrapper. Never dynamically index a chained `google.script.run` builder.
- No Python, Node server, backend service, external API, OAuth, Apps Script Properties, secrets, market data, Form sync, browser extension, or database other than the bound spreadsheet.
- All report reads must bulk-read sheet ranges once per request. All writes must append/set complete rows in batches where practical. No cell-by-cell report loops and no N+1 Sheet access.

## 3. Fixed sheets and exact headers

The Lite database has **exactly six sheets**. Initialization creates only missing Lite sheets. It never deletes, renames, or silently replaces a spreadsheet.

| Sheet | Headers in exact order |
|---|---|
| `Settings` | `key, value, updatedAt` |
| `Accounts` | `id, name, accountType, accountGroup, openingDate, openingBalance, active, deletedAt, notes, createdAt, updatedAt` |
| `Movements` | `id, date, movementType, fromAccountId, toAccountId, amount, description, notes, status, createdAt, updatedAt` |
| `Expenses` | `id, date, accountId, amount, expenseCategory, expenseNature, description, notes, status, createdAt, updatedAt` |
| `ExpenseCategories` | `code, label, defaultNature, sortOrder, active` |
| `AuditLog` | `id, occurredAt, action, entityType, entityId, details` |

Dates are stored and returned as ISO calendar dates (`YYYY-MM-DD`). Timestamps are ISO strings. Amounts are non-negative decimal numbers rounded to two decimal places at write time. IDs are UUID strings.

`AuditLog` is an operational trace only; it is never included in balance/report calculations. It is not a hidden financial source of truth.

## 4. Accounts: fixed types, groups, and defaults

Every bucket is an `Accounts` row. There is no separate Investments, Funds, Holdings, Prices, or ValuationSnapshots sheet.

| Account type | Group | Creation |
|---|---|---|
| `CASH` | `CASH` | default, and optional additional cash/savings account |
| `EXPENSE` | `EXPENSE` | default, optional additional expense account |
| `MUTUAL_FUND`, `STOCK`, `PPF`, `NPS`, `GOLD`, `FIXED_DEPOSIT` | `INVESTMENT` | investment account |
| `EMERGENCY_FUND`, `TRAVEL_FUND`, `CHIT`, `HOME_FUND`, `VEHICLE_FUND`, `EDUCATION_FUND`, `FUTURE_EXPENSE_FUND` | `FUND` | fund account |
| `CUSTOM` | either `INVESTMENT` or `FUND` | custom account; group is required |

Initialization must seed these active zero-opening accounts, exactly once: `Cash / Salary` (`CASH`), `Expenses` (`EXPENSE`), `Mutual Funds`, `Stocks`, `PPF`, `NPS`, and `Gold`.

Opening balance means money already in the bucket before use of Lite. It is neither income nor a monthly addition, does not create a movement, and must not appear in monthly charts. Existing detailed investments are imported only by manually entering one Lite account and its opening balance; no old data is copied automatically.

## 5. The only money actions

| Action | Movement row | Balance effect | Dashboard meaning |
|---|---|---|---|
| Record income | `INCOME`; to required | increases destination | monthly Income |
| Add amount | `ADD`; to required | increases destination | manual external addition; not Income |
| Withdraw amount | `WITHDRAW`; from required | decreases source | external withdrawal; not Expense |
| Move amount | `MOVE`; both required | decreases source and increases destination | allocation when destination is INVESTMENT or FUND |
| Record expense | `Expenses` row, not `Movements` | decreases selected expense/cash account | monthly Expense |

All rows begin `ACTIVE`. A void changes only `status` to `VOID`; voided rows contribute zero. Edits replace the allowed fields in the same row and immediately recalculate derived views. Each successful create/edit/void writes one audit row. The system has no credit, debt, negative balance, interest, recurring transaction, automatic Chit contribution, Chit payout, sale, dividend, or transfer-fee concept.

Balance formula, always calculated rather than stored:

`openingBalance + active INCOME/ADD/MOVE-in - active WITHDRAW/MOVE-out - active Expenses charged to the account`.

Move requires different source and destination accounts. Income/Add require no source. Withdraw requires no destination. An Expense requires no Movement row. A source account cannot go below zero after an active action. New actions require active, non-deleted accounts. Expenses may be charged only to a `CASH` or `EXPENSE` account.

## 6. Archive and delete

- **Archive**: sets `active=false`. The account remains visible when “Include archived” is enabled and all history remains visible. It cannot receive a new action.
- **Delete account**: user-facing wording is “Delete account”. It is a safe soft delete: allowed only when its current derived balance is exactly `0.00`; it sets `active=false` and `deletedAt`. Rows are retained for historical reports. Deleted accounts are hidden by default and never physically removed.
- An account with a non-zero balance must be withdrawn or moved out before Delete is enabled. The UI tells the user the precise remaining balance.

## 7. Required reporting formulas

For the selected calendar month (default current month):

- **Income**: `INCOME` to any account in month.
- **Expenses**: active expense amounts in month.
- **Net allocated to investments & funds**: active `MOVE` amounts entering `INVESTMENT` or `FUND` accounts minus active `MOVE` amounts leaving those groups during the month. `ADD` and `WITHDRAW` are not allocations.
- **Salary allocation remainder**: `Income - Expenses - Net allocated to investments & funds`. It is a monthly allocation indicator only, not a bank balance.
- **Tracked balances**: sum of current derived balances across all non-deleted accounts, displayed by account group. Since moves affect one source and one destination equally, money is counted once.

Use the labels above. Do not say Net Worth, Current Value, Current Net Worth, Market Value, NAV, Unrealized Gain/Loss, Cost Basis, Holdings, or Portfolio.

## 8. Explicit non-goals

Absent by design: full double-entry accounting, reconciliations, liabilities/credit cards, live stock/NAV data, unit counts, price history, valuation snapshots, returns/XIRR, realised/unrealised gains, market P&L, brokerage sync, payments integration, Google Form sync, recurring schedules, SIP engine, automated Chit logic, goals engine, budgets, tax calculations, and data scraping.

# Shared Implementation Contract — FinTrack Lite

Read this document before every implementation prompt. It is mandatory.

## Public server API

Only these callable Apps Script functions may be exposed to the browser:

`initializeFinTrackLite`, `getBootstrapData`, `getDashboardData`, `getAccountsPageData`, `getExpenseReport`, `getActivityPage`, `createAccount`, `updateAccount`, `archiveAccount`, `deleteAccount`, `recordIncome`, `addToAccount`, `withdrawFromAccount`, `moveBetweenAccounts`, `createExpense`, `updateExpense`, `voidExpense`, `updateMovement`, `voidMovement`, `runAllTests`.

Every non-test API returns `{ ok: true, data: ... }` or throws a user-safe `Error`. Do not return HTML, sheet objects, `Date` objects, or partially mutated state. Validate every request on the server; client validation is only a convenience.

## Data and validation defaults

- Date is mandatory and cannot be later than today in the spreadsheet time zone.
- Amount is mandatory, finite, and greater than `0`; store it rounded to 2 decimals.
- Name is required after trim, maximum 80 characters, unique case-insensitively among non-deleted accounts.
- Description and notes are optional, maximum 240 and 1,000 characters respectively.
- All create/update/void calls use `LockService` and must validate before any sheet write.
- Never swallow a failed write. Throw it and write no success audit row.
- Status values are exactly `ACTIVE` and `VOID`.
- An edit/void of a row that would make a source account negative is rejected.
- All current balances are derived from the rows described in the architecture reference; no `balance` column, cached total, or dashboard snapshot is permitted.

## Expense categories

Seed and retain the current Expenses-module categories plus the Lite-specific category `wife_expenses` / `Wife Expenses`, in this exact order: `food` / `Food & Takeaway`, `grocery` / `Grocery`, `vegetables_fruits` / `Vegetables & Fruits`, `travel` / `Travel`, `commute` / `Commute`, `housing` / `Housing`, `parents_fund` / `Parents Fund`, `health` / `Health`, `personal_care` / `Personal Care`, `subscriptions` / `Subscriptions & Software`, `entertainment` / `Entertainment`, `utilities` / `Utilities`, `shopping` / `Shopping`, `wife_expenses` / `Wife Expenses`, `other` / `Other`. Seed `Housing` and `Subscriptions & Software` with default nature `FIXED`; all other categories default to `VARIABLE`. The user selects `FIXED` or `VARIABLE` per expense. Category configuration is not editable in Lite.

## Client contract

- `google.script.run` is used through one `callServer_(method, payload)` Promise helper. It must explicitly map each allowed method name to the appropriate `google.script.run...method(payload)` call. Never use `google.script.run...[method]` on a chained runner.
- Prevent duplicate submits: disable the submit button while a request is active, restore it on both success and failure, and use a client request guard per form.
- Refresh only the current view after a write and update cached bootstrap account/category data from the response or one bounded reload.
- All user-visible errors appear in the dialog/form message and are announced with `role="alert"`; use a toast for success.
- Format money with INR and `en-IN`; display no fake decimals when value is a whole rupee.

## File organization

`Code.gs` contains only `doGet`, HTML includes, and public wrappers. Put constants/schema in `Config.gs`; sheet access in `Database.gs`; validation in `Validation.gs`; balance math in `BalanceService.gs`; account behavior in `AccountService.gs`; movements in `MovementService.gs`; expenses in `ExpenseService.gs`; reports in `ReportService.gs`; and tests in `TestHarness.gs`. `Index.html`, `Styles.html`, and `Client.html` are the client application. Do not add speculative service files.

## Required acceptance evidence for every prompt

State files changed, exact test command/result, and any deliberately deferred work. Never deploy, run `clasp push`, replace a database, or change an existing production spreadsheet unless the user expressly asks for that action.

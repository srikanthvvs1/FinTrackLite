# Prompt 03 — Preserve the Simple Expenses Module

Read the shared references first. Retain the current Expenses page behaviour and visual hierarchy, but bind it to Lite account semantics.

## Server behaviour

`createExpense({date,accountId,amount,expenseCategory,expenseNature,description,notes})` accepts active `CASH` or `EXPENSE` accounts only. It requires one seeded active category and `FIXED` or `VARIABLE`, validates available balance after the expense, and writes one active `Expenses` row plus audit row. It does not create a Movement row.

`updateExpense` permits date, active source account, amount, category, nature, description, and notes. Validate final available balance excluding the original active row. `voidExpense` changes status to `VOID` only after checking that removing the row leaves a valid state. No hard deletion.

`getExpenseReport({startDate,endDate,category,nature,accountId,includeVoid})` defaults to the current calendar month, makes one bulk read per source, and returns:

- applied filters;
- total, fixed total, variable total, active transaction count;
- category totals including every seeded active category, zero-filled;
- active/void rows newest first; and
- source account names.

The regular Expenses UI defaults to active rows; it must not expose an include-void filter. A voided expense remains visible as voided only in Activity.

## User experience

- Top-header `+ Add Entry` opens the existing quick-add chooser first. Choices are exactly: Record income, Add amount, Withdraw amount, Move amount, Expense. Do not add investment-specific action choices.
- Choosing Expense opens the fastest form: Date defaults today; source defaults `Expenses` when active, otherwise first active eligible source; category is required and starts blank; nature auto-fills category default but remains editable; amount required; description and notes optional.
- Expenses view has its established start/end, category, nature, account filters, Apply/Clear controls, summary cards, Spending by category doughnut, legend, and entry list.
- Doughnut chart excludes zero categories from slices but legend includes only categories with spending. Centre shows total. When total is zero, show a textual empty state; do not render a one-value doughnut.
- Desktop uses the current compact table; mobile uses cards. Edit and Void actions require explicit confirmation for Void.

## Explicitly preserve

Expense category reporting is distinct from cash allocation. Moving `Cash / Salary → Expenses` is an allocation, not an expense. Recording an expense from `Expenses` is spending. Moving to an investment/fund is not an expense and must never appear in Spending by category.

## Required tests

Test default source selection, every category and nature, date/account/category filters, zero category handling, insufficient funds, editing source/amount, void effect, and the distinction between an expense and a move to an investment or fund.

## Mandatory executable validation gate

Follow `002_EXECUTABLE_VALIDATION_PROTOCOL.md` in full. Enter the five-month expense stimulus only through the visible Expense form; then check each filter combination, desktop table, mobile cards, Edit, Void confirmation, and source-account Recent activity. Reconcile the expected ₹77,000 total expense reduction and the May ₹12,000 category split. Hover/tap the Spending by category chart and verify its centre total, legend, amounts, percentages, and absence of x/y axes. A blank, zero-only, non-interactive, or visually clipped chart is a failure.

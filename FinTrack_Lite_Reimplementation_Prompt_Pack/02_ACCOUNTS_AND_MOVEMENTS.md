# Prompt 02 — Lightweight Accounts and Movements

Read the shared references first. Implement only the lightweight account/bucket model.

## Account creation and editing

`createAccount(payload)` accepts `name`, `accountType`, `openingDate`, `openingBalance`, and optional `notes`. `accountGroup` is derived from type, except `CUSTOM`, where payload must explicitly provide either `INVESTMENT` or `FUND`. The form never asks for a group for a non-custom type.

`updateAccount(payload)` may change only `name` and `notes`. Account type, group, opening date, and opening balance are immutable after creation. Explain this in the edit form: use an adjustment only if an opening entry was wrong. Do not create an adjustment feature in this prompt; invalid original opening data must be corrected by re-creating the account before activity begins.

Show types in this exact order: Cash / Savings (`CASH`), Expense account, Mutual Funds, Stocks, PPF, NPS, Gold, Fixed Deposit, Emergency Fund, Travel Fund, Chit, Home Fund, Vehicle Fund, Education Fund, Future Expense Fund, Custom Fund/Investment. The user chooses a readable account name; type is not used as a forced name.

## Movement action contracts

- `recordIncome({date,toAccountId,amount,description,notes})`: destination must be active/non-deleted. It creates `INCOME`.
- `addToAccount({date,toAccountId,amount,description,notes})`: creates `ADD`; label it “Add amount”, not income.
- `withdrawFromAccount({date,fromAccountId,amount,description,notes})`: creates `WITHDRAW`; source must retain non-negative balance.
- `moveBetweenAccounts({date,fromAccountId,toAccountId,amount,description,notes})`: creates `MOVE`; accounts differ, are active/non-deleted, and source remains non-negative.
- `updateMovement({id,date,amount,description,notes,fromAccountId,toAccountId})`: preserves the row’s `movementType`; fields not relevant to its type must remain blank. Revalidate balance effects excluding the edited row before saving.
- `voidMovement({id})`: requires active row, performs non-negative balance validation after removing it, then changes only status to `VOID`.

Dates cannot be in the future. Actions cannot target a deleted or inactive account. There are no negative or zero actions, fees, recurring actions, interest, payouts, unit purchases, or movements automatically created from an account type.

## Derived balance service

Implement one pure balance calculation operating on bulk-loaded Account, Movement, and Expense arrays. It returns a per-account map plus total by group. Balance uses the fixed formula in the architecture document. Both report services and mutation validations use this same pure function; do not duplicate financial arithmetic.

## Account page data

`getAccountsPageData({selectedAccountId, activityStartDate, activityEndDate, includeArchived})` defaults to the current calendar month for activity dates and returns at most 100 selected-account activity rows, newest first. It returns a `hasMore` flag/cursor for older rows. The selected account remains selected after actions.

Activity rows combine movements touching the selected account and expenses charged to it, sorted date descending then createdAt descending. Display signed effect relative to selected account: incoming positive, outgoing/expense negative. This is a presentation list, not a separate ledger source.

## Required tests

Test each type of account can be created, opening balance has no movement/income effect, income/add/withdraw/move balance math, moves are wealth-neutral, expenses reduce a source, insufficient balance fails without write, inactive/deleted accounts are blocked, and edit/void recalculate correctly.

## Mandatory executable validation gate

Follow `002_EXECUTABLE_VALIDATION_PROTOCOL.md` in full. Through the rendered GUI, create every listed account type, execute the five-month stimulus, perform the paired Add/Withdraw on every active account, void the Fixed Deposit addition, and compare each selected account’s Recent activity and balance with the exact reconciliation table. Also try an over-withdrawal, inactive-account action, non-zero Delete, zero-balance Delete, movement edit, and void; verify the visible error/success state and no incorrect sheet/data change. Capture desktop and mobile evidence.

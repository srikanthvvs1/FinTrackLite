# Prompt 06 — Final Validation and Compliance Review

Read shared references first. This is a verification and defect-fix prompt only. Do not add features.

## Required validation

1. Run `runAllTests()` using the local in-memory Spreadsheet/Apps Script harness. Report every test name and result.
2. Run the local UI preview validation and inspect the generated desktop and mobile screenshots for Dashboard, Expenses, Accounts, Investments & Funds, and Activity.
3. Run the clasp-exclusion validation. Prompt packs, tests, local-preview files, and tooling must not be eligible for push.
4. Inspect every sheet header and count. There must be exactly six Lite sheets and no calculated balance/total sheet.
5. Search source for forbidden functionality and ensure it is absent: valuation, NAV, price, market value, XIRR, unit, provider, Yahoo, AMFI, broker, recurring, SIP, payout, interest, credit card, liability, reconciliation, Google Form, Python, server.
6. Confirm that `Code.gs` contains only shell/public wrapper responsibilities, schemas are centralized, validation is centralized, reports bulk-read, errors are not swallowed, and browser-call names exactly match the shared contract.
7. Execute the entire browser-driven five-month scenario in `002_EXECUTABLE_VALIDATION_PROTOCOL.md`. Compare every account, group, dashboard card, expense category, activity row, chart series, tooltip, legend, and axis against its stated expected value. Repeat at desktop, tablet, mobile, and small-mobile widths. This step cannot be replaced by code review, local harness assertions, or static screenshots.

## Final compliance matrix

Return PASS/FAIL with evidence for: Google Apps Script architecture; fixed six-sheet schema; account balance derivation; movement semantics; expense semantics; opening-balance treatment; void/edit/archive/delete rules; dashboard/report formulas; forbidden scope; GUI style/responsiveness; performance; test suite; clasp exclusions.

## Required final statement

Explicitly state: “No out-of-scope full-ledger, valuation, market-data, recurring, or provider features were added.” List every corrected file and any remaining limitation. Do not deploy or alter a live spreadsheet.

Also include the preview/test URL or command, the actual GUI actions taken, screenshot paths, a reconciliation table of observed versus expected results, and the result of every chart hover/tap inspection. A failed or unperformed GUI action makes the final matrix FAIL.

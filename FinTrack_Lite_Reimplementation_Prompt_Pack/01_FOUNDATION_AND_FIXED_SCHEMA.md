# Prompt 01 — Foundation, Fixed Schema, and Initialization

Read the three shared reference documents first.

Implement the FinTrack Lite Google Apps Script foundation. This is a fresh Lite database, not a modification of the previous full-ledger schema. Keep any old project/database untouched unless an explicitly selected new spreadsheet is bound to this Lite project.

## Required files

Create or refactor only: `appsscript.json`, `Code.gs`, `Config.gs`, `Database.gs`, `Validation.gs`, `Index.html`, `Styles.html`, `Client.html`, `TestHarness.gs`, `.claspignore`, and README instructions if required.

## Exact tasks

1. Set V8 runtime and HTML Service web app configuration. `doGet()` serves `Index` with title `FinTrack` and viewport suitable for mobile.
2. In `Config.gs`, centralize the six sheet names, their header arrays exactly as in the architecture reference, status/type/group lists, seeded account definitions, and seeded expense categories. No duplicate string literals in business services.
3. `initializeFinTrackLite()` obtains a script lock, validates every existing Lite header exactly, creates only missing Lite sheets with frozen header row, and writes seed rows only if their identifying keys/names do not already exist. It is safe to run repeatedly.
4. Header mismatch is a hard error naming sheet, expected headers, and actual headers. Never alter an existing header automatically.
5. `Database.gs` has bulk `readRows(sheetName)`, `appendRow(s)`, `updateRowById`, and header-index helpers. All rows are mapped by headers, not magic column positions.
6. The initial client shell loads bootstrap data through the single client RPC wrapper and shows a clear initialisation error with a retry action if the spreadsheet is unavailable.
7. `.claspignore` must exclude `TestHarness.gs`, local-preview output, test fixtures, prompt packs, and all tools. Verify via the repository’s clasp exclusion validation script if it exists.

## Do not implement

Do not implement accounts actions, expenses, reports, navigation content, API integrations, legacy migration, valuation, or a database reset. Do not add sheets beyond the fixed six.

## Tests required

Add tests proving first initialization, repeat initialization, exact seeded rows, exact six-sheet count, and a header mismatch failure. Run `runAllTests()` before finishing.

## Mandatory executable validation gate

Follow `002_EXECUTABLE_VALIDATION_PROTOCOL.md`. Invoke the rendered application and verify first load, retry-on-initialisation-error behaviour, correct seeded accounts/categories, and responsive shell at all four required widths. Capture screenshots. This prompt may not be declared complete from unit tests or source review alone.

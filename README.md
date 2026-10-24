# FinTrack Lite

FinTrack Lite is a Google Apps Script HTML Service application backed by one bound Google Spreadsheet.

## Set up the foundation

1. Create a new Google Spreadsheet for FinTrack Lite. Do not reuse or replace an existing finance database.
2. Open **Extensions → Apps Script** from that spreadsheet and add the project files in this repository.
3. Run `initializeFinTrackLite()` once from the Apps Script editor and authorize access when prompted.
4. Run `runAllTests()` in a development copy. A passing result reports 16 passed, 0 failed.
5. Deploy as a web app only when you explicitly intend to publish a test or production deployment.

Initialization is idempotent. It creates only missing Lite sheets, validates all existing Lite headers exactly, freezes each header row, and inserts only missing settings, starter accounts, and expense categories. It never deletes, renames, or resets a sheet.

## Prompt 03 local validation

Run `node local-preview/test.js` to invoke `runAllTests()` locally. Run `node local-preview/server.js` and open http://127.0.0.1:4173 for the isolated rendered preview (test date 2026-05-31). All money data is disposable and resets when the process restarts. See `local-preview/PROMPT03_VALIDATION.md` for GUI actions, reconciliation, and screenshot evidence.


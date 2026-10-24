# FinTrack Lite

FinTrack Lite is a Google Apps Script HTML Service application backed by one Google Spreadsheet configured through FINTRACK_LOCAL_CONFIG.SPREADSHEET_ID in the ignored local PrivateConfig.gs file. Web app requests open this spreadsheet explicitly by ID.

## Set up the foundation

1. Create a new Google Spreadsheet for FinTrack Lite. Do not reuse or replace an existing finance database.
2. Copy PrivateConfig.example.gs to PrivateConfig.gs and replace YOUR_SPREADSHEET_ID locally. Copy .clasp.example.json to .clasp.json and replace YOUR_APPS_SCRIPT_PROJECT_ID locally. Push the project files to Apps Script. The deployment owner must have edit access to the spreadsheet.
3. Run `initializeFinTrackLite()` once from the Apps Script editor and authorize access when prompted.
4. Run `runAllTests()` in a development copy. A passing result reports 16 passed, 0 failed.
5. Deploy as a web app only when you explicitly intend to publish a test or production deployment.

Initialization is idempotent. It creates only missing Lite sheets, validates all existing Lite headers exactly, freezes each header row, and inserts only missing settings, starter accounts, and expense categories. It never deletes, renames, or resets a sheet.

## Prompt 03 local validation

Run `node local-preview/test.js` to invoke `runAllTests()` locally. Run `node local-preview/server.js` and open http://127.0.0.1:4173 for the isolated rendered preview (test date 2026-05-31). All money data is disposable and resets when the process restarts. See `local-preview/PROMPT03_VALIDATION.md` for GUI actions, reconciliation, and screenshot evidence.


Run node local-preview/test-spreadsheet.js to verify web app spreadsheet access and local test isolation.

## Private local configuration

Real IDs must never be committed. Git tracks only these templates:

- PrivateConfig.example.gs -> copy to PrivateConfig.gs for the spreadsheet ID.
- .clasp.example.json -> copy to .clasp.json for the Apps Script project ID.
- .deployment.example.json -> copy to .deployment.local.json for the web app deployment ID.

The destination files are ignored by Git. Keep them locally. PrivateConfig.gs is uploaded to Apps Script so the deployed app can access its spreadsheet; example files are excluded from Apps Script uploads. Never force-add ignored configuration files to Git.

After a source change, run clasp push --force, then update the existing deployment using its ID from .deployment.local.json. Recreate the local configuration from the templates when setting up another checkout.
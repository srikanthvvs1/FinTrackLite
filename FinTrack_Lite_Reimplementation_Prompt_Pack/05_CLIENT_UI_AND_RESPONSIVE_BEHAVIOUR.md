# Prompt 05 — Client UI, Exact Style, and Responsive Behaviour

Read shared references first. Build all screens with the current application’s plain HTML/CSS/vanilla JavaScript style. Do not replace the client with React, Vue, Svelte, templates requiring a build, or a new design system.

## Navigation and loading

Use the fixed five destinations in `001_GUI_REFERENCE.md`; desktop sidebar and mobile bottom nav must be the same accessible links. Navigation changes the view without reloading the HTML shell. The selected nav item has `aria-current="page"`. When loading a page, retain its prior content where possible and show a small in-panel loading state; only first bootstrap uses the full overlay.

## Dialog forms

Use one native `<dialog>` (`quick-add-dialog`) and the current `dialog-header`/`quick-add-body` pattern. Each form has explicit label association, required markers only for required values, a visible `form-message`, Cancel, and a disabled-while-saving primary button. Selecting an action from the quick-add chooser immediately opens its form.

Move form has From account, To account, date, amount, description optional, notes optional. It filters both lists to active, non-deleted accounts; destination excludes selected source. Record income and Add amount label the destination `To account`; Withdraw labels the source `From account`. Never demand a description or note.

## Accounts and type tiles

Do not reuse legacy Investment cards, valuation panes, unit-entry fields, ticker fields, provider controls, or recurring reminder components. Investment & Funds tiles must be responsive `auto-fit` cards, not a horizontal carousel. Tile selection uses the pale green active state and is keyboard operable.

## Accessibility and presentation requirements

- Semantic headings retain logical order. Buttons have discernible text. Charts have a compact text summary available to screen readers.
- Dates are rendered consistently as `dd-MMM-yyyy` in tables/cards; form controls use native date inputs.
- Money is right-aligned in desktop numeric columns, no wrapping; all status/action labels remain readable at 320px.
- Do not put x/y axis labels on doughnut charts. Do not render an empty canvas, a flat meaningless line, or overlapping labels.
- Errors from Apps Script are escaped and presented as user text; no raw stack trace in the UI.

## Required local UI preview cases

Desktop 1440x1000, tablet 768x1024, mobile 390x844, and small mobile 320x568: Dashboard, Expenses, Accounts with 25 accounts, Investments & Funds with 30 accounts, Activity, quick-add menu, every action dialog, account creation, and account deletion disabled/enabled states. Assert no horizontal page overflow, no clipped primary action, correct sidebar/bottom-nav switch, independently scrollable desktop account list, and accessible labels.

## Mandatory executable validation gate

Follow `002_EXECUTABLE_VALIDATION_PROTOCOL.md` in full. The result must be a browser-driven inspection of rendered controls, not visual reasoning from CSS/source. Create the deterministic data through the GUI, hover/tap each chart, and save screenshots for every required viewport and state. At each narrow width verify readable amounts, labels, dates, buttons, legends, and axes; no automatic “PASS” is allowed merely because the page loaded.

# Exact GUI Reference — FinTrack Lite

The current FinTrack Expenses page is the visual and interaction reference. Preserve its coding style; do not introduce a CSS framework, component library, gradients, glass effects, icon dependency, new font, dense admin table, or a different navigation pattern.

## Tokens and shell

- Font stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Canvas `#f7f9fc`; surface white; ink `#172033`; muted `#64748b`; line `#e2e8f0`; brand green `#176b5a`; pale selected background `#eaf5f2`; danger `#b42318` / `#fef3f2`.
- Use the existing visual geometry: 9px controls, 12–13px cards, 16px panel padding, 42px primary button height, subtle `0 12px 30px rgba(23,32,51,.08)` shadow only where the existing style uses it.
- Sticky white top header with FinTrack mark and primary `+ Add Entry` button.
- At 768px and above: 208px left navigation, content separated by a 1px line. At below 768px: no sidebar, fixed five-item bottom navigation with safe-area padding. Page content must leave bottom padding for it.
- The navigation labels are exactly `Dashboard`, `Expenses`, `Accounts`, `Investments & Funds`, `Activity`. Active link uses pale green background and green text.

## Existing class and composition conventions to reuse

Reuse and extend these class names rather than inventing an unrelated design language: `top-header`, `brand`, `brand-mark`, `app-layout`, `primary-nav`, `bottom-nav`, `nav-link`, `view-container`, `view-heading`, `eyebrow`, `button`, `button-primary`, `button-secondary`, `button-small`, `metric-card`, `metric-label`, `metric-value`, `entry-form`, `field`, `form-actions`, `form-message`, `quick-add-dialog`, `dialog-header`, `quick-add-body`, `toast-region`, `expense-filters`, `expense-summary-grid`, `expense-summary-card`, `expense-chart-panel`, `expense-list-panel`, `account-row`, `account-layout`, `ledger-panel`.

“ledger-panel” may be retained as a CSS class solely for an account’s **Recent activity** panel; call it Recent activity in all UI text. Do not call the product a ledger.

## Page rhythm

Each page follows: uppercase green eyebrow → dark large heading → one muted sentence → filters/controls → white bordered summary cards → white bordered chart/list panels. The Expenses page keeps its existing monthly first-load range, category/nature/account filters, four summary cards, doughnut chart, legend, desktop table, and mobile card list.

## Charts

- Use Chart.js already bundled by the current application; do not add a chart library.
- Every chart must have a useful title, INR value tooltip, legend, and non-overlapping axes. Doughnut charts have no x/y axes and show the total in the centre.
- Month charts show at most 12 month labels; use `MMM yy`, skip labels when needed, and format y-axis in compact INR with full INR in tooltips.
- Render a clear empty state instead of a blank or zero-only chart.
- No price, NAV, market-value, or gain/loss chart exists in Lite.

## Responsive rules

- Desktop tables convert to readable stacked cards at `max-width:600px`.
- Never force a page-wide horizontal scrollbar. A table wrapper may scroll horizontally only for the Activity table, and it must have a card alternative on mobile.
- Filters are 2 columns on mobile and become their specified desktop grid; buttons remain reachable. Dialog width is `min(560px, calc(100vw - 24px))` and vertical content scrolls inside the dialog.
- Account list is independently scrollable on desktop: max height `calc(100vh - 230px)`, sticky within its column; selecting an account must not jump the page. On mobile it is normal document flow and recent activity follows the selected account.
- Use 44px minimum touch targets and no hover-only action.

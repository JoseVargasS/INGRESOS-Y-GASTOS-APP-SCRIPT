# AGENTS.md - Bucks Manager

## Project Overview

Bucks Manager is a personal finance web application built with Google Apps Script and Google Sheets. The spreadsheet serves as a private database, while the interface offers an app-like experience for recording movements, reviewing metrics, searching transactions, and analyzing monthly/annual charts.

## Architecture

### Files Structure

| File | Purpose |
|------|---------|
| `Code.gs` | Backend in Google Apps Script. Reads/writes to Google Sheets, creates monthly rows, calculates data, and exposes functions to the frontend. |
| `Index.html` | Main app structure. Loads styles, scripts, Chart.js, Font Awesome, and Google Fonts. |
| `Styles.html` | Visual styles, themes, responsive layout, table, skeleton loaders, and charts. |
| `Scripts.html` | Client logic: navigation, forms, table, search, charts, cache, and calls to `google.script.run`. |
| `icon.png` | App/PWA icon. |

### Google Sheets Structure

The app expects two sheets with exact names:

1. **INGRESOS Y GASTOS** - Main transaction sheet
   - Column A: Date (Google Sheets date format)
   - Column B: Amount (positive for income, negative for expenses)
   - Column C: Detail (free description)
   - Column D: Type (one of the four supported types)
   - Column E: Creation timestamp (auto-generated for new transactions)

2. **RESUMEN POR MES** - Monthly summary sheet
   - Column A: Month (first day of month as date)
   - Column B: Frequent Income (manual)
   - Column C: Non-Frequent Income (auto-formula)
   - Column D: Total Income (formula)
   - Column E: Frequent Expense (auto-formula)
   - Column F: Non-Frequent Expense (auto-formula)
   - Column G: Total Expenses (formula)
   - Column H: Monthly Net (formula)
   - Column I: Net without Frequent Income (formula)

## Supported Transaction Types

| Type | Description |
|------|-------------|
| `INGRESO FRECUENTE` | Fixed monthly income (salary, etc.) |
| `INGRESO NO FRECUENTE` | One-time income (interests, returns, sales, bonuses) |
| `GASTO FRECUENTE` | Recurring expenses (internet, subscriptions, services, rent) |
| `GASTO NO FRECUENTE` | One-time expenses (purchases, orders, variable costs) |

## Code Organization (After Refactoring)

### Scripts.html - Frontend JavaScript

#### Helper Functions
- `extractAvailableYears(data)` - Extracts available years from summary data
- `renderYearChips(years)` - Renders year selection chips
- `filterDataByYear(data, year)` - Filters data by selected year
- `calculateKPIAggregates(yearData)` - Calculates KPI aggregates
- `updateKPICards(totals)` - Updates KPI cards in DOM
- `getThemeColors()` - Gets current theme colors
- `getBaseTooltipConfig(colors, type)` - Base tooltip configuration
- `getBaseLegendConfig(isMobile, position)` - Base legend configuration
- `getPieDatalabelsConfig(isMobile)` - Pie chart datalabels configuration
- `renderPieCharts(totals, colors, isMobile)` - Renders income/expense pie charts
- `renderMonthlyTrendChart(yearData, colors, isMobile)` - Renders monthly trend chart
- `calculateDetailRows(yearData)` - Calculates processed detail rows
- `calculateMaxBars(detailRows)` - Calculates max values for progress bars
- `renderDetailStrip(detailRows)` - Renders summary strip (mini cards)
- `renderDetailTableRows(detailRows, maxBars)` - Renders detail table rows

#### Date Helpers
- `formatDateToISO(date)` - Converts date to YYYY-MM-DD format
- `parseSpanishDate(dateStr)` - Converts "28-feb-26" format to Date object
- `transactionDateToISO(transaction)` - Converts transaction date to ISO format

#### Interannual Chart Helpers
- `buildInterannualData(metric)` - Builds year-keyed data for charts
- `buildComparisonDatasets(...)` - Builds datasets for comparison mode
- `buildMetricDatasets(...)` - Builds datasets for specific metrics
- `calculateChartWidth(...)` - Calculates required chart width
- `buildChartContainer(...)` - Builds chart HTML container
- `getInterannualChartOptions(...)` - Gets chart options configuration

### Code.gs - Backend

#### Helper Functions
- `findHeaderRow(data, defaultRow)` - Finds header row in summary sheet
- `_addTransactionCore(transactionData)` - Core transaction addition logic

## Development Guidelines

### Google Apps Script Constraints

1. **No separate .js or .css files** - All JavaScript must be in `<script>` tags within HTML files, and all CSS must be in `<style>` tags within HTML files.

2. **HTML includes** - You can create additional HTML files and use the `include()` function to include them as partials.

3. **File naming** - Use exact sheet names as specified (INGRESOS Y GASTOS, RESUMEN POR MES).

### Code Style

1. **JavaScript** - Use ES6+ features (const/let, arrow functions, template literals, destructuring).

2. **CSS** - Use CSS custom properties for theming and consistent values.

3. **Backend** - Use `var` for Google Apps Script compatibility (older V8 runtime).

### Best Practices

1. **Minimize API calls** - Use caching and batch operations when possible.

2. **Error handling** - Always handle errors from `google.script.run` calls.

3. **Responsive design** - Test on both desktop and mobile viewports.

4. **Theme support** - Respect light/dark theme variables in all new components.

## Common Tasks

### Adding a New Transaction Type

1. Update the type options in `setupCustomDropdown()` function
2. Update the `abbreviateType()` function mapping
3. Update CSS classes for row highlighting and pill colors
4. Update the formulas in `ensureMonthlyRowExists()` if needed

### Adding a New Chart

1. Create a new canvas element in `Index.html`
2. Add chart initialization in the appropriate render function
3. Use the existing helper functions for tooltips, legends, and datalabels
4. Register any new Chart.js plugins in `registerChartPluginsOnce()`

### Modifying the Summary Sheet Structure

1. Update the formulas in `ensureMonthlyRowExists()` function
2. Update the `getMonthlySummaryData()` function to read new columns
3. Update the `renderSummaryTable()` and related helper functions

## Performance Considerations

1. **DOM Updates** - Use DocumentFragment for batch DOM insertions
2. **Chart Rendering** - Destroy previous chart instances before creating new ones
3. **Data Caching** - Use the `transactionCache` variable for client-side caching
4. **Skeleton Loaders** - Show skeleton loaders during data fetching

## Troubleshooting

### Common Issues

1. **Sheet not found errors** - Verify exact sheet names (case-sensitive, with accents)
2. **Date parsing issues** - Ensure dates are real Google Sheets dates, not text
3. **Formula errors** - Check that summary sheet has proper header row with "MES"
4. **Chart not rendering** - Verify Chart.js and ChartDataLabels are loaded

### Debugging

1. Use `console.log()` in Code.gs for server-side debugging
2. Use browser DevTools for client-side debugging
3. Check the Apps Script execution log for errors

## Recent Refactoring (v4.2)

### Changes Made

1. **Scripts.html** - Split `renderSummaryTable()` into 12 focused functions
2. **Scripts.html** - Extracted chart configuration factories (tooltips, legends, datalabels)
3. **Scripts.html** - Split `renderCharts()` into 7 focused functions
4. **Scripts.html** - Created date helper functions (`formatDateToISO`, `parseSpanishDate`, `transactionDateToISO`)
5. **Code.gs** - Consolidated `addTransaction` and `addTransactionOptimized` using `_addTransactionCore()`
6. **Code.gs** - Extracted `findHeaderRow()` helper for header row detection
7. **Styles.html** - Removed duplicate CSS properties

### Benefits

- **Maintainability** - Smaller, focused functions are easier to understand and modify
- **Reusability** - Helper functions can be used across multiple features
- **Consistency** - Shared configuration factories ensure uniform chart styling
- **Performance** - Reduced code duplication and improved organization

# Feature: Quarter-over-Quarter Trends

**Epic:** Stock Analysis Foundation (issue #1)
**Vision Brief:** specs/stock-analyzer-vision.md

## Summary

Show how a stock's key financial metrics trend across the last 4 quarters, with both a table view (arrows/colors) and a chart view, so investors can spot improvement or decline at a glance.

## Motivation

A single snapshot of fundamentals (Feature 1a) tells you where a stock stands today but not where it's heading. Investors need to see whether key metrics are improving or deteriorating quarter over quarter to make confident buy/hold/sell decisions and catch underperformers before they drag down a portfolio.

## User Stories & Acceptance Criteria

### Story 1: View quarterly trends for a stock
**As a** retail investor, **I want** to see how key metrics have changed over the last 4 quarters **so that** I can tell if the company is improving or declining.

**Acceptance Criteria:**
1. After looking up a stock, a "Quarterly Trends" section is visible below the fundamentals dashboard
2. The following metrics are displayed across the last 4 quarters:
   - Revenue
   - EPS
   - Gross Margin
   - Operating Margin
   - Net Margin
   - Free Cash Flow
   - Revenue Growth (YoY)
   - Debt-to-Equity
3. Each metric shows values for Q1 through Q4 (most recent 4 quarters), labeled by fiscal period (e.g., Q1 2025, Q2 2025)
4. Data is fetched from the FMP quarterly financial statements API

### Story 2: Quickly see direction of change
**As a** retail investor, **I want** to see at a glance whether each metric is trending up or down **so that** I don't have to mentally compare numbers across columns.

**Acceptance Criteria:**
1. In the table view, each quarter-over-quarter change is indicated with a colored arrow (green up-arrow for improvement, red down-arrow for decline, gray dash for no change)
2. "Improvement" is context-aware: for Revenue, EPS, Margins, and FCF, up is good; for Debt-to-Equity, down is good
3. The percentage change from the previous quarter is displayed next to each arrow

### Story 3: Toggle between table and chart view
**As a** retail investor, **I want** to switch between a table view and a chart view **so that** I can see trends in whichever format is easier for me to read.

**Acceptance Criteria:**
1. A toggle control (e.g., "Table | Chart") is visible above the quarterly trends section
2. Table view is the default
3. Chart view displays a line chart for each metric across the 4 quarters
4. Charts use the same green/red color scheme — green line if the overall trend is improving, red if declining
5. Switching between views preserves the data without re-fetching

### Global Acceptance Criteria
1. Quarterly trends data is cached alongside the fundamentals data (same 30-minute cache window)
2. If quarterly data is unavailable for a stock, the trends section displays "Quarterly data not available" rather than crashing
3. Numbers are displayed in human-readable format consistent with the fundamentals dashboard ($1.2B, 23.45%)
4. The trends section loads within the same 3-second window as the fundamentals dashboard (single page load, not a separate request from the user)
5. If a stock has fewer than 4 quarters of data (e.g., recently IPO'd), the available quarters are shown and missing quarters display empty cells — the section does not hide or error

## Scope

### In Scope
- Fetching quarterly financial data (income statement, balance sheet) from FMP API
- Table view with directional arrows and percentage changes
- Line chart view for each metric
- Toggle between table and chart views
- Caching quarterly data

### Out of Scope
- Customizing which metrics appear in the trends view (fixed set for now)
- More than 4 quarters of history
- Quarterly comparison between two different stocks (that's Feature 3a)
- Annotations or commentary on what changed (that's Feature 2b)
- Downloading or exporting trend data

## Approach

- Extend the existing backend `/api/stock/:ticker` response to include quarterly data, or add a new endpoint `/api/stock/:ticker/quarterly`
- Fetch from FMP `/stable/income-statement` and `/stable/balance-sheet-statement` with `period=quarter&limit=4`
- Add a lightweight chart library to the client (e.g., Recharts — React-native, small bundle)
- New frontend components: TrendsSection, TrendsTable, TrendsChart, ViewToggle

## Changes

- **Server:** New or extended endpoint for quarterly data, new FMP service methods for quarterly income statement and balance sheet
- **Client:** New components in `client/src/components/Trends/`, chart library dependency, integration into the existing Dashboard view
- **Shared types:** New `QuarterlyData` interface

## Verification

1. Start the app (`npm run dev`)
2. Search for `AAPL`
3. Confirm the Quarterly Trends section appears below the fundamentals dashboard
4. Confirm 8 metrics are shown across 4 quarters in a table with arrows and percentage changes
5. Confirm Revenue and EPS arrows are green when the value increased, red when decreased
6. Confirm Debt-to-Equity arrows are green when the value *decreased* (lower is better)
7. Click the "Chart" toggle — confirm line charts render for each metric
8. Click back to "Table" — confirm the table reappears without re-fetching data
9. Search for a stock with missing quarterly data — confirm a graceful "Quarterly data not available" message
10. Search for `AAPL` again within 30 minutes — confirm the response is cached

## Open Questions

- None at this time.

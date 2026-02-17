# Feature: Stock Lookup & Fundamentals Dashboard

**Epic:** Stock Analysis Foundation (issue #1)
**Vision Brief:** specs/stock-analyzer-vision.md

## Summary

Search for any stock by ticker symbol and view a comprehensive fundamentals dashboard showing company profile, valuation metrics, profitability, growth, financial health, dividends, market data, and RSI — all pulled from free APIs.

## Motivation

Retail investors need a single place to quickly look up a stock and see its key financial metrics at a glance. Today, this requires visiting multiple financial websites and mentally piecing together the picture. This feature provides the foundation for all subsequent features (scoring, comparison, portfolio tracking).

## User Stories

- As a retail investor, I want to search for a stock by ticker so that I can quickly pull up its data.
- As a retail investor, I want to see the company name, sector, and description so that I understand what the company does.
- As a retail investor, I want to see key financial metrics organized by category so that I can evaluate the stock's fundamentals without visiting multiple sites.
- As a retail investor, I want to see RSI so that I have a technical signal alongside the fundamentals.

## Approach

- **Frontend:** React web application (single-page app)
- **Data source:** Free stock API (e.g., Yahoo Finance via a proxy/wrapper, Alpha Vantage free tier, or Financial Modeling Prep free tier) — choose whichever provides the broadest coverage of the required metrics in a single or minimal number of calls
- **Backend:** Lightweight API layer (Node.js/Express or Python/FastAPI) to proxy requests to the stock data API, keeping API keys server-side
- **No authentication** — single user, no login required
- **Caching:** Server-side cache for API responses to avoid hitting rate limits on free APIs. Cached data is served for repeat lookups within the cache window
- **Firebase** can be used for hosting/deployment
- **Scope limitation:** Only actively traded stocks on major US exchanges (NYSE, NASDAQ). Delisted companies and penny stocks/OTC are out of scope

## Dashboard Layout

### Company Profile Section
- Company name
- Ticker symbol
- Sector / Industry
- Brief company description

### Metrics by Category

**Valuation**
| Metric | Description |
|--------|-------------|
| P/E Ratio | Price-to-earnings (trailing twelve months) |
| Forward P/E | Price-to-earnings based on forward estimates |
| PEG Ratio | P/E relative to earnings growth rate |
| Price-to-Book | Market price relative to book value |
| Price-to-Sales | Market cap relative to revenue |

**Profitability**
| Metric | Description |
|--------|-------------|
| EPS | Earnings per share (trailing twelve months) |
| Revenue | Total revenue (most recent period) |
| Gross Margin | Gross profit as % of revenue |
| Operating Margin | Operating income as % of revenue |
| Net Margin | Net income as % of revenue |
| ROE | Return on equity |

**Growth**
| Metric | Description |
|--------|-------------|
| Revenue Growth (YoY) | Year-over-year revenue change |
| EPS Growth (YoY) | Year-over-year EPS change |

**Financial Health**
| Metric | Description |
|--------|-------------|
| Debt-to-Equity | Total debt relative to shareholder equity |
| Current Ratio | Current assets / current liabilities |
| Free Cash Flow | Cash from operations minus capital expenditures |

**Dividends**
| Metric | Description |
|--------|-------------|
| Dividend Yield | Annual dividend as % of stock price |
| Payout Ratio | % of earnings paid as dividends |

**Market Data**
| Metric | Description |
|--------|-------------|
| Market Cap | Total market capitalization |
| 52-Week High | Highest price in the last 52 weeks |
| 52-Week Low | Lowest price in the last 52 weeks |
| Average Volume | Average daily trading volume |

**Technical**
| Metric | Description |
|--------|-------------|
| RSI (14-day) | Relative Strength Index — momentum oscillator (0-100) |

## Changes

### New files to create
- Frontend: React app with search input and dashboard view
- Backend: API proxy service with endpoint to fetch stock data by ticker
- Shared: Data models/types for stock metrics

### Infrastructure
- Project scaffolding (package.json, build config, etc.)
- Firebase hosting configuration (if deploying via Firebase)

## Acceptance Criteria

1. User can enter a stock ticker symbol in a search field and submit it
2. Valid ticker returns a dashboard displaying the company name, ticker, sector/industry, and a brief description
3. Dashboard displays all metrics listed above, organized by category (Valuation, Profitability, Growth, Financial Health, Dividends, Market Data, Technical)
4. RSI (14-day) is displayed in the Technical section
5. Metrics that are unavailable for a given stock (e.g., dividends for non-dividend stocks) are shown as "N/A" rather than hidden
6. Invalid or unrecognized ticker displays a clear error message
7. API keys are stored server-side, not exposed in the frontend
8. Dashboard loads within 3 seconds for a typical stock lookup
9. The app works in modern browsers (Chrome, Firefox, Safari, Edge)
10. No user authentication is required — the app is usable immediately on load
11. Dashboard displays a "Data as of [date/time]" timestamp showing when the data was last fetched
12. All large numbers are displayed in human-readable format (e.g., $1.2B, $340M, 12.5K) — not raw integers
13. Repeat lookups for the same ticker within the cache window are served from cache without hitting the external API
14. Delisted stocks and OTC/penny stocks return a clear message indicating they are not supported

## Open Questions

- Which free API provides the best coverage of all these metrics in the fewest calls? (Evaluate during implementation — recommend Financial Modeling Prep or Yahoo Finance wrapper)
- Should metric values include contextual hints (e.g., "P/E of 35 is above sector average")? Deferring to Epic 2 where scoring provides this context.

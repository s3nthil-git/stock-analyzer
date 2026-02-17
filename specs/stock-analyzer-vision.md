# Vision Brief: Stock Analyzer

## The Problem

Individual retail investors don't have an easy way to evaluate stocks against standard financial metrics, track performance quarter over quarter, or compare stocks side by side. This makes it hard to feel confident when buying and easy to miss warning signs when a stock they own starts underperforming.

## Who Feels It

Individual retail investors managing personal portfolios, particularly long-term investors who do periodic check-ins rather than daily trading. They want data-driven decisions but don't have Wall Street tools.

## The Vision

Investors feel confident about every buy decision because it's backed by fundamentals, analyst consensus, and a clear score. They also know exactly when to sell because they can see performance deterioration over consecutive quarters — no more second-guessing or holding losers too long.

## Key Capabilities

1. **Evaluate fundamentals** — Analyze a stock against standard financial metrics (P/E, EPS, revenue growth, margins, debt ratios, etc.)
2. **Quarter-over-quarter tracking** — See how key metrics trend across quarters to spot improvement or decline
3. **Side-by-side comparison** — Compare two stocks on the same metrics, whether they're in the same sector or not
4. **Stock score & recommendation** — Get a 1-100 score with a clear Buy/Hold/Sell recommendation, with full transparency into how the score is calculated
5. **Change highlights** — See what changed since the previous quarter with a one-to-two line summary
6. **Analyst consensus** — View analyst ratings and consensus data as an additional signal

## What Success Looks Like

- Users stop second-guessing their stock picks because the data backs their decisions
- Users catch underperformers early — within one or two bad quarters — before they drag down the portfolio

## Constraints & Context

- **Platform:** Web application
- **Data sources:** Free, open APIs only to start (e.g., Yahoo Finance API via `yfinance`, Alpha Vantage free tier) — no paid services or user-provided financial website credentials
- **Portfolio size:** Must support tracking at least 100 stocks per user
- **Scoring transparency:** The 1-100 scoring formula must be visible to the user — show the breakdown of how the score is calculated
- **User model:** Single user to start, no authentication required
- **Notifications:** Not needed for initial version
- Firebase project already initialized

## Open Questions

- None at this time — all major decisions resolved.

## Feature Breakdown

### Epic 1: Stock Analysis Foundation (issue #1)
- [ ] Feature 1a: Stock lookup & fundamentals dashboard — Search for a stock by ticker and see key financial metrics pulled from a free API
- [ ] Feature 1b: Quarter-over-quarter trends — View how a stock's key metrics change across quarters with visual charts

### Epic 2: Scoring & Recommendations (issue #2)
- [ ] Feature 2a: Stock scoring engine — Calculate a 1-100 score based on weighted fundamentals, with a transparent breakdown
- [ ] Feature 2b: Buy/Hold/Sell recommendation — Map the score to a recommendation with summary and change highlights

### Epic 3: Comparison & Portfolio (issue #3)
- [ ] Feature 3a: Side-by-side stock comparison — Compare two stocks on the same metrics and scores
- [ ] Feature 3b: Portfolio tracker — Save up to 100 stocks, see all scores at a glance, spot underperformers

### Epic 4: Analyst Data (issue #4)
- [ ] Feature 4a: Analyst consensus integration — Show analyst ratings, price targets, and consensus alongside the stock score

**Recommended starting feature:** Feature 1a: Stock lookup & fundamentals dashboard — it's the foundation everything else builds on.

# Stock Scoring Engine — Feature 2a Design

**Date:** 2026-03-21
**Status:** Approved
**Feature:** 2a — Stock Scoring Engine (Epic 2: Scoring & Recommendations)

---

## Overview

A client-side scoring engine that produces a 1–100 score for any NYSE/NASDAQ stock based on weighted financial metrics benchmarked against sector peers. Users choose between Growth and Value presets, then adjust individual metric weights to match their investment philosophy. Weights persist in localStorage. The score updates instantly on any change.

---

## Architecture

### Approach: Pure client-side

All scoring logic lives in the React client as TypeScript utilities. No new server endpoints. The score is computed from `StockData` already loaded by `useStockData`. Sector benchmarks are a hardcoded static data file.

**Why:** Weights are user-specific, so they naturally belong on the client. All required data is already fetched. Zero extra latency — score recalculates instantly as sliders move.

### New files

```
client/src/
  data/
    sectorBenchmarks.ts       # Static benchmark thresholds per sector
  utils/
    scoringEngine.ts          # Pure function: StockData + WeightConfig → ScoreResult | null
  hooks/
    useWeights.ts             # Manages weight state, presets, localStorage persistence
  components/
    ScorePanel/
      ScorePanel.tsx          # Sticky sidebar: score, breakdown, preset toggle
      ScorePanel.module.css
      WeightEditor.tsx        # Inline sliders for weight adjustment
      WeightEditor.module.css
```

### Modified files

```
client/src/
  App.tsx                     # Two-column layout (metrics left, sticky sidebar right)
  App.module.css              # CSS grid layout styles
  types/stock.ts              # Add ScoreResult, WeightConfig, ScoringPreset types
                              # NOTE: client uses client/src/types/stock.ts (not shared/)
```

---

## Metric Value Extraction

The client receives `StockData` which contains `categories: MetricCategory[]`. Metric values are accessed by searching for a matching `label` string within `categories[].metrics[]`, not via direct field paths.

A shared lookup helper is the canonical way to extract scored values:

```ts
// client/src/utils/scoringEngine.ts

function extractMetricValue(categories: MetricCategory[], label: string): number | null {
  for (const cat of categories) {
    const metric = cat.metrics.find(m => m.label === label);
    if (metric !== undefined) {
      // MetricValue.value is typed as number | string | null.
      // String values (e.g. "N/A") are an expected runtime path — return null for them.
      return typeof metric.value === 'number' ? metric.value : null;
    }
  }
  return null;
}
```

### Label-to-MetricKey mapping

The following labels are used to extract each `MetricKey` from `StockData.categories`:

| MetricKey | Label in StockData | Category |
|-----------|-------------------|----------|
| `peRatio` | `"P/E Ratio"` | Valuation |
| `pegRatio` | `"PEG Ratio"` | Valuation |
| `revenueGrowth` | `"Revenue Growth (YoY)"` | Growth |
| `epsGrowth` | `"EPS Growth (YoY)"` | Growth |
| `grossMargin` | `"Gross Margin"` | Profitability |
| `operatingMargin` | `"Operating Margin"` | Profitability |
| `netMargin` | `"Net Margin"` | Profitability |
| `roe` | `"ROE"` | Profitability |
| `debtToEquity` | `"Debt-to-Equity"` | Financial Health |
| `currentRatio` | `"Current Ratio"` | Financial Health |

---

## Scoring Algorithm

### Per-metric sub-score (0–100)

Each metric is scored using linear interpolation between sector-specific `poor` and `excellent` thresholds, then clamped to [0, 100]:

```ts
// "Higher is better" metrics (grossMargin, operatingMargin, netMargin, roe,
//  revenueGrowth, epsGrowth, currentRatio)
rawScore = clamp((value - poor) / (excellent - poor), 0, 1) * 100

// "Lower is better" metrics (peRatio, pegRatio, debtToEquity)
rawScore = clamp((poor - value) / (poor - excellent), 0, 1) * 100
```

**Current ratio note:** Values above `excellent` clamp to 100. There is no penalty for high current ratios — clamping at the `excellent` threshold is sufficient for this feature.

If a metric value is `null`, that metric is **excluded** from calculation and remaining weights are renormalised before computing the final score (see below).

### Final score

```ts
const activeMetrics = allMetrics.filter(m => m.subScore !== null);
const totalWeight = activeMetrics.reduce((sum, m) => sum + weights[m.key], 0);

if (totalWeight === 0) return null; // all metrics null → insufficient data

const score = Math.round(
  activeMetrics.reduce((sum, m) => sum + (m.subScore! * weights[m.key]), 0) / totalWeight
);
```

Returns `null` when no metrics have values (displayed as "Insufficient Data" in the UI).

### Score → Recommendation mapping

| Score | Recommendation |
|-------|---------------|
| 80–100 | Strong Buy |
| 65–79 | Buy |
| 45–64 | Hold |
| 30–44 | Sell |
| 0–29 | Strong Sell |

---

## Category-to-MetricKey Mapping

Used to compute per-category sub-scores shown in the ScorePanel breakdown:

| Category title (in breakdown) | MetricKeys included |
|-------------------------------|---------------------|
| Growth | `revenueGrowth`, `epsGrowth` |
| Valuation | `peRatio`, `pegRatio` |
| Profitability | `grossMargin`, `operatingMargin`, `netMargin`, `roe` |
| Financial Health | `debtToEquity`, `currentRatio` |

Category sub-score = weighted average of its included metrics using the active weights (with null exclusion and weight renormalisation applied within the category).

---

## Sector Benchmarks

Benchmarks are defined per sector as `{ poor, excellent }` thresholds for each metric. The lookup key is `StockData.profile.sector`.

**`'N/A'` handling:** `fmpService` sets `sector: profile.sector || 'N/A'` when the FMP response has no sector. The benchmark lookup must treat `'N/A'` explicitly as a missing sector and fall back to `default`:

```ts
const sectorKey = benchmarks[sector] ? sector : 'default';
```

Covered sectors: Technology, Healthcare, Financials, Consumer Cyclical, Consumer Defensive, Industrials, Energy, Utilities, Real Estate, Communication Services, Basic Materials.
A `default` entry covers `'N/A'` and any other unrecognised value.

Example (Technology):
```ts
Technology: {
  peRatio:         { poor: 50,    excellent: 15   },
  pegRatio:        { poor: 3.0,   excellent: 0.5  },
  revenueGrowth:   { poor: 0.02,  excellent: 0.25 },
  epsGrowth:       { poor: 0.02,  excellent: 0.30 },
  grossMargin:     { poor: 0.30,  excellent: 0.70 },
  operatingMargin: { poor: 0.05,  excellent: 0.30 },
  netMargin:       { poor: 0.03,  excellent: 0.25 },
  roe:             { poor: 0.05,  excellent: 0.35 },
  debtToEquity:    { poor: 2.5,   excellent: 0.3  },
  currentRatio:    { poor: 0.8,   excellent: 2.5  },
}
```

---

## Weight Presets

Two presets. **Growth** is the default on first load.

`WeightConfig` is `Record<MetricKey, number>` — **all 10 keys are always present**, including metrics with a weight of `0`. Preset tables show only non-zero entries; the omitted metrics default to `0`.

### Growth preset (default)

| Metric | Weight |
|--------|--------|
| `revenueGrowth` | 25 |
| `epsGrowth` | 20 |
| `roe` | 15 |
| `operatingMargin` | 15 |
| `peRatio` | 10 |
| `pegRatio` | 10 |
| `debtToEquity` | 5 |
| `grossMargin` | 0 |
| `netMargin` | 0 |
| `currentRatio` | 0 |
| **Total** | **100** |

### Value preset

| Metric | Weight |
|--------|--------|
| `peRatio` | 25 |
| `netMargin` | 20 |
| `debtToEquity` | 20 |
| `currentRatio` | 15 |
| `roe` | 10 |
| `grossMargin` | 10 |
| `revenueGrowth` | 0 |
| `epsGrowth` | 0 |
| `operatingMargin` | 0 |
| `pegRatio` | 0 |
| **Total** | **100** |

---

## Weight Persistence (localStorage)

Key: `stock-analyzer:weights`

Shape:
```ts
{
  preset: 'growth' | 'value' | 'custom',
  lastNamedPreset: 'growth' | 'value',  // always the last non-custom preset applied
  weights: WeightConfig   // Record<MetricKey, number>, all 10 keys, sum = 100
}
```

- **On load:** Read from localStorage. If missing or invalid JSON, silently apply Growth preset (in-memory only — no error shown to user, no localStorage write until user interacts). `lastNamedPreset` defaults to `'growth'`.
- **On preset button click:** Overwrite weights with preset values; set both `preset` and `lastNamedPreset` to the chosen preset; persist immediately.
- **On slider move:** Set `preset` to `'custom'`; leave `lastNamedPreset` unchanged; auto-rebalance (see below); persist immediately.
- **`resetToPreset()`:** Reads `lastNamedPreset` from state and re-applies that preset's weights. Sets `preset` back to `lastNamedPreset`. Because `lastNamedPreset` is always a named preset (never `'custom'`), this is always unambiguous.
- **localStorage unavailable:** Falls back to in-memory Growth preset for the session. No user-visible error. Weights reset on every page load. No indication is shown to the user.

### Weight slider constraint — auto-rebalance model

The total of all weights is **always exactly 100**. When the user moves a slider, the engine auto-rebalances: the delta is absorbed proportionally across all other non-zero-weight metrics.

```
delta = newValue - oldValue
totalOfOthers = sum of weights for all keys ≠ dragged key (excluding those already at 0)
for each other non-zero key:
  weight[key] -= delta * (weight[key] / totalOfOthers)
```

After rebalancing, all values are rounded to integers and any rounding error is applied to the largest non-zero weight. The total indicator in the UI always shows "Total: 100% ✓" in green — it never turns red because the total never deviates.

**Dragging a 0-weight slider up:** When the dragged key's prior value is 0, `delta = newValue - 0`. The rebalancing formula distributes this delta across the other non-zero keys as normal. The dragged key's prior value of 0 does not appear in the denominator (`totalOfOthers`); only the other non-zero keys do.

**Rounding to 0:** Proportional reduction can push a small non-zero weight to 0 after integer rounding. This is treated as intentional — the weight remains at 0 (it is not restored). The "largest non-zero weight" adjustment corrects the sum without special-casing these rounded-to-zero entries.

**Edge case:** If all other metrics are at 0, the dragged slider cannot be increased (clamped to its current value). This prevents a stuck state.

---

## `useWeights` Hook Interface

```ts
// client/src/hooks/useWeights.ts

interface UseWeightsReturn {
  weights: WeightConfig;                 // current weights (always sums to 100)
  preset: ScoringPreset;                 // 'growth' | 'value' | 'custom'
  lastNamedPreset: 'growth' | 'value';   // last non-custom preset applied (never 'custom')
  setWeight: (key: MetricKey, value: number) => void;  // triggers auto-rebalance + persist
  applyPreset: (preset: 'growth' | 'value') => void;   // applies preset weights + persist
  resetToPreset: () => void;             // re-applies lastNamedPreset weights + sets preset to lastNamedPreset
}

export function useWeights(): UseWeightsReturn
```

---

## UI Components

### ScorePanel (sticky sidebar)

- **Preset toggle** — "Growth" / "Value" pill buttons. Active preset highlighted green.
- **Score display** — large number (e.g. `82`), "out of 100" sub-label.
- **Recommendation badge** — coloured pill: Strong Buy (green), Buy (light green), Hold (yellow), Sell (orange), Strong Sell (red).
- **Progress bar** — gradient left→right (red→yellow→green), thumb positioned at score. Labels: Sell · Hold · Buy.
- **Category breakdown** — four rows (Growth, Valuation, Profitability, Financial Health), each with a mini bar and sub-score number.
- **"⚙ Adjust weights" link** — toggles WeightEditor expanded/collapsed.
- **Insufficient data state** — when `scoringEngine` returns `null`, score displays as "—", recommendation shows "Insufficient Data" (grey badge), breakdown is hidden.

### WeightEditor (inline, below ScorePanel)

- One slider row per metric (label left, percentage value right).
- Sliders are `<input type="range" min="0" max="100">` styled to match dark theme.
- Total indicator always shows "Total: 100% ✓" in green (auto-rebalance guarantees this).
- "Reset to [preset] preset" button — calls `resetToPreset()`. Label reflects last named preset (e.g. "Reset to Growth preset").
- Metrics with weight `0` are shown greyed out but remain draggable.

### Dashboard layout change

`App.tsx` changes from single-column to a two-column CSS grid:

```
┌────────────────────────────┬──────────────┐
│  CompanyProfile            │              │
│  MetricSections            │  ScorePanel  │
│  TrendsSection             │  (sticky)    │
└────────────────────────────┴──────────────┘
```

Right column: `position: sticky; top: 1rem; align-self: start;` so the score stays visible while scrolling.

**Responsive:** Below 768px, layout collapses to single column. ScorePanel appears below CompanyProfile and above MetricSections.

---

## Data Flow

```
StockData (from useStockData)
  └── scoringEngine.ts (pure function)
        ├── sectorBenchmarks.ts  (static lookup by profile.sector)
        └── WeightConfig         (from useWeights hook → localStorage)
              └── ScoreResult | null
                    └── ScorePanel.tsx
                          └── WeightEditor.tsx → setWeight() → useWeights → re-score
```

---

## TypeScript Types

Added to `client/src/types/stock.ts`:

```ts
export type MetricKey =
  | 'peRatio' | 'pegRatio' | 'revenueGrowth' | 'epsGrowth'
  | 'grossMargin' | 'operatingMargin' | 'netMargin' | 'roe'
  | 'debtToEquity' | 'currentRatio';

export type ScoringPreset = 'growth' | 'value' | 'custom';

// All 10 MetricKey entries always present; values are integers 0–100 summing to 100
export type WeightConfig = Record<MetricKey, number>;

export interface MetricScore {
  key: MetricKey;
  label: string;
  value: number | null;
  subScore: number | null;   // null when value was null
  weight: number;
}

export interface CategoryScore {
  title: string;             // 'Growth' | 'Valuation' | 'Profitability' | 'Financial Health'
  score: number | null;      // null when all metrics in category are null
}

export interface ScoreResult {
  score: number;                                              // 0–100
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  breakdown: CategoryScore[];
  metricScores: MetricScore[];
}

// scoringEngine returns null when no metrics have values (insufficient data)
export type ScoringOutput = ScoreResult | null;
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Metric value is `null` | Exclude from calculation; renormalise remaining weights |
| All metric values `null` | `scoringEngine` returns `null`; ScorePanel shows "—" and "Insufficient Data" |
| Unrecognised sector string | Falls back to `default` benchmark thresholds |
| `profile.sector === 'N/A'` | Treated as unrecognised; falls back to `default` |
| localStorage unavailable | In-memory Growth preset for session; no error shown; weights reset on reload |
| All other weights are 0 when dragging | Slider clamped; total stays 100 |

---

## Out of Scope

- Buy/Hold/Sell recommendation narrative and change highlights (Feature 2b)
- Analyst consensus data (Feature 4a)
- Saving/comparing scores across multiple stocks (Feature 3b)
- User-defined custom benchmark thresholds
- Scoring from quarterly trend data (only TTM/annual metrics are scored)

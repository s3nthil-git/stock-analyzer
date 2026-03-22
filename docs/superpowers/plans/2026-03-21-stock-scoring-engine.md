# Stock Scoring Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side 1–100 stock scoring engine with sector-relative benchmarks, Growth/Value presets, user-adjustable weights, and a sticky sidebar ScorePanel to the existing React dashboard.

**Architecture:** Pure client-side scoring — a `scoreStock()` pure function reads metric values from `StockData.categories` by label, benchmarks them against static sector thresholds, applies user-defined weights, and returns a `ScoreResult`. A `useWeights` hook manages weight state and localStorage persistence. A sticky `ScorePanel` sidebar renders the score and an inline `WeightEditor`.

**Tech Stack:** React 19, TypeScript, Vite, CSS Modules, vitest + jsdom + @testing-library/react (added in Task 1), localStorage.

**Spec:** `docs/superpowers/specs/2026-03-21-stock-scoring-engine-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `client/vite.config.ts` | Modify | Add vitest test config |
| `client/package.json` | Modify | Add vitest + @testing-library/react deps + test script |
| `client/src/types/stock.ts` | Modify | Add MetricKey, WeightConfig, ScoringPreset, ScoreResult, ScoringOutput types |
| `client/src/data/sectorBenchmarks.ts` | Create | Static benchmark thresholds for 11 sectors + default |
| `client/src/utils/scoringEngine.ts` | Create | Pure functions: extractMetricValue, computeSubScore, scoreStock |
| `client/src/utils/scoringEngine.test.ts` | Create | Unit tests for scoring engine |
| `client/src/hooks/useWeights.ts` | Create | Weight state, presets, auto-rebalance, localStorage persistence |
| `client/src/hooks/useWeights.test.ts` | Create | Tests for rebalance logic and hook behaviour |
| `client/src/components/ScorePanel/WeightEditor.tsx` | Create | Inline sliders for metric weight adjustment |
| `client/src/components/ScorePanel/WeightEditor.module.css` | Create | Styles for WeightEditor |
| `client/src/components/ScorePanel/ScorePanel.tsx` | Create | Sticky sidebar: score, recommendation, breakdown, preset toggle |
| `client/src/components/ScorePanel/ScorePanel.module.css` | Create | Styles for ScorePanel |
| `client/src/components/ScorePanel/ScorePanel.test.tsx` | Create | Render tests for ScorePanel |
| `client/src/App.tsx` | Modify | Two-column layout: existing dashboard left, ScorePanel right |
| `client/src/App.module.css` | Modify | CSS grid layout + responsive breakpoint |

---

## Task 1: Test infrastructure

**Files:**
- Modify: `client/vite.config.ts`
- Modify: `client/package.json`

- [ ] **Step 1: Install vitest and testing libraries**

```bash
cd client && npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Add test config to vite.config.ts**

Replace the full file contents:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `client/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add test script to package.json**

In `client/package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify test infrastructure works**

Create a temporary smoke test `client/src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `cd client && npm test`
Expected: `1 passed`

- [ ] **Step 6: Delete the temporary smoke test**

```bash
rm client/src/smoke.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add client/vite.config.ts client/package.json client/package-lock.json client/src/test-setup.ts
git commit -m "chore: add vitest + testing-library test infrastructure"
```

---

## Task 2: Scoring types

**Files:**
- Modify: `client/src/types/stock.ts`

- [ ] **Step 1: Append scoring types to stock.ts**

Append to the end of `client/src/types/stock.ts`:

```ts
// ── Scoring Engine Types ──────────────────────────────────────────────────

export type MetricKey =
  | 'peRatio' | 'pegRatio' | 'revenueGrowth' | 'epsGrowth'
  | 'grossMargin' | 'operatingMargin' | 'netMargin' | 'roe'
  | 'debtToEquity' | 'currentRatio';

export type ScoringPreset = 'growth' | 'value' | 'custom';

/** All 10 MetricKey entries always present; values are integers 0–100 summing to 100. */
export type WeightConfig = Record<MetricKey, number>;

export interface MetricScore {
  key: MetricKey;
  label: string;
  value: number | null;
  subScore: number | null; // null when value was null
  weight: number;
}

export interface CategoryScore {
  title: string; // 'Growth' | 'Valuation' | 'Profitability' | 'Financial Health'
  score: number | null; // null when all metrics in category are null
}

export interface ScoreResult {
  score: number; // 0–100
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  breakdown: CategoryScore[];
  metricScores: MetricScore[];
}

/** scoreStock returns null when no metrics have values (insufficient data). */
export type ScoringOutput = ScoreResult | null;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/types/stock.ts
git commit -m "feat: add scoring engine TypeScript types"
```

---

## Task 3: Sector benchmarks data

**Files:**
- Create: `client/src/data/sectorBenchmarks.ts`

- [ ] **Step 1: Write failing test**

Create `client/src/data/sectorBenchmarks.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sectorBenchmarks } from './sectorBenchmarks';

describe('sectorBenchmarks', () => {
  const ALL_METRIC_KEYS = [
    'peRatio', 'pegRatio', 'revenueGrowth', 'epsGrowth',
    'grossMargin', 'operatingMargin', 'netMargin', 'roe',
    'debtToEquity', 'currentRatio',
  ];

  it('includes a default entry', () => {
    expect(sectorBenchmarks['default']).toBeDefined();
  });

  it('every sector entry has all 10 metrics', () => {
    for (const [sector, benchmarks] of Object.entries(sectorBenchmarks)) {
      for (const key of ALL_METRIC_KEYS) {
        expect(benchmarks[key], `${sector}.${key}`).toBeDefined();
        expect(typeof benchmarks[key].poor).toBe('number');
        expect(typeof benchmarks[key].excellent).toBe('number');
      }
    }
  });

  it('Technology benchmarks exist and are reasonable', () => {
    const tech = sectorBenchmarks['Technology'];
    expect(tech).toBeDefined();
    expect(tech.peRatio.poor).toBeGreaterThan(tech.peRatio.excellent); // lower P/E is better
    expect(tech.grossMargin.excellent).toBeGreaterThan(tech.grossMargin.poor); // higher margin is better
  });

  it('covers all 11 named sectors', () => {
    const expected = [
      'Technology', 'Healthcare', 'Financials', 'Consumer Cyclical',
      'Consumer Defensive', 'Industrials', 'Energy', 'Utilities',
      'Real Estate', 'Communication Services', 'Basic Materials',
    ];
    for (const sector of expected) {
      expect(sectorBenchmarks[sector], sector).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd client && npm test src/data/sectorBenchmarks.test.ts
```
Expected: FAIL — `sectorBenchmarks.ts` does not exist yet

- [ ] **Step 3: Create sectorBenchmarks.ts**

Create `client/src/data/sectorBenchmarks.ts`:

```ts
import type { MetricKey } from '../types/stock';

export type BenchmarkThreshold = { poor: number; excellent: number };
export type SectorBenchmark = Record<MetricKey, BenchmarkThreshold>;

export const sectorBenchmarks: Record<string, SectorBenchmark> = {
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
  },
  Healthcare: {
    peRatio:         { poor: 40,    excellent: 15   },
    pegRatio:        { poor: 2.5,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.02,  excellent: 0.15 },
    epsGrowth:       { poor: 0.02,  excellent: 0.20 },
    grossMargin:     { poor: 0.30,  excellent: 0.65 },
    operatingMargin: { poor: 0.05,  excellent: 0.25 },
    netMargin:       { poor: 0.03,  excellent: 0.20 },
    roe:             { poor: 0.05,  excellent: 0.25 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
  Financials: {
    peRatio:         { poor: 20,    excellent: 8    },
    pegRatio:        { poor: 2.0,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.12 },
    epsGrowth:       { poor: 0.01,  excellent: 0.15 },
    grossMargin:     { poor: 0.20,  excellent: 0.60 },
    operatingMargin: { poor: 0.10,  excellent: 0.40 },
    netMargin:       { poor: 0.05,  excellent: 0.30 },
    roe:             { poor: 0.05,  excellent: 0.18 },
    debtToEquity:    { poor: 5.0,   excellent: 1.0  },
    currentRatio:    { poor: 0.8,   excellent: 2.0  },
  },
  'Consumer Cyclical': {
    peRatio:         { poor: 30,    excellent: 12   },
    pegRatio:        { poor: 2.5,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.15 },
    epsGrowth:       { poor: 0.02,  excellent: 0.20 },
    grossMargin:     { poor: 0.15,  excellent: 0.45 },
    operatingMargin: { poor: 0.03,  excellent: 0.18 },
    netMargin:       { poor: 0.02,  excellent: 0.12 },
    roe:             { poor: 0.05,  excellent: 0.25 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
  'Consumer Defensive': {
    peRatio:         { poor: 25,    excellent: 12   },
    pegRatio:        { poor: 2.5,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.10 },
    epsGrowth:       { poor: 0.01,  excellent: 0.12 },
    grossMargin:     { poor: 0.15,  excellent: 0.50 },
    operatingMargin: { poor: 0.05,  excellent: 0.20 },
    netMargin:       { poor: 0.03,  excellent: 0.15 },
    roe:             { poor: 0.05,  excellent: 0.22 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
  Industrials: {
    peRatio:         { poor: 25,    excellent: 12   },
    pegRatio:        { poor: 2.5,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.12 },
    epsGrowth:       { poor: 0.02,  excellent: 0.15 },
    grossMargin:     { poor: 0.15,  excellent: 0.40 },
    operatingMargin: { poor: 0.03,  excellent: 0.18 },
    netMargin:       { poor: 0.02,  excellent: 0.12 },
    roe:             { poor: 0.05,  excellent: 0.20 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
  Energy: {
    peRatio:         { poor: 20,    excellent: 8    },
    pegRatio:        { poor: 2.0,   excellent: 0.5  },
    revenueGrowth:   { poor: -0.05, excellent: 0.20 },
    epsGrowth:       { poor: -0.05, excellent: 0.25 },
    grossMargin:     { poor: 0.10,  excellent: 0.40 },
    operatingMargin: { poor: 0.05,  excellent: 0.25 },
    netMargin:       { poor: 0.02,  excellent: 0.15 },
    roe:             { poor: 0.03,  excellent: 0.18 },
    debtToEquity:    { poor: 1.5,   excellent: 0.2  },
    currentRatio:    { poor: 0.7,   excellent: 2.0  },
  },
  Utilities: {
    peRatio:         { poor: 25,    excellent: 14   },
    pegRatio:        { poor: 3.0,   excellent: 1.0  },
    revenueGrowth:   { poor: -0.02, excellent: 0.08 },
    epsGrowth:       { poor: -0.02, excellent: 0.10 },
    grossMargin:     { poor: 0.15,  excellent: 0.45 },
    operatingMargin: { poor: 0.10,  excellent: 0.30 },
    netMargin:       { poor: 0.05,  excellent: 0.20 },
    roe:             { poor: 0.05,  excellent: 0.14 },
    debtToEquity:    { poor: 3.0,   excellent: 0.5  },
    currentRatio:    { poor: 0.5,   excellent: 1.5  },
  },
  'Real Estate': {
    peRatio:         { poor: 40,    excellent: 15   },
    pegRatio:        { poor: 3.0,   excellent: 0.8  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.12 },
    epsGrowth:       { poor: 0.01,  excellent: 0.15 },
    grossMargin:     { poor: 0.20,  excellent: 0.55 },
    operatingMargin: { poor: 0.10,  excellent: 0.35 },
    netMargin:       { poor: 0.05,  excellent: 0.25 },
    roe:             { poor: 0.02,  excellent: 0.12 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.5,   excellent: 2.0  },
  },
  'Communication Services': {
    peRatio:         { poor: 35,    excellent: 15   },
    pegRatio:        { poor: 2.5,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.20 },
    epsGrowth:       { poor: 0.02,  excellent: 0.25 },
    grossMargin:     { poor: 0.25,  excellent: 0.65 },
    operatingMargin: { poor: 0.05,  excellent: 0.30 },
    netMargin:       { poor: 0.03,  excellent: 0.22 },
    roe:             { poor: 0.05,  excellent: 0.30 },
    debtToEquity:    { poor: 2.5,   excellent: 0.3  },
    currentRatio:    { poor: 0.7,   excellent: 2.5  },
  },
  'Basic Materials': {
    peRatio:         { poor: 20,    excellent: 8    },
    pegRatio:        { poor: 2.0,   excellent: 0.5  },
    revenueGrowth:   { poor: -0.03, excellent: 0.15 },
    epsGrowth:       { poor: -0.05, excellent: 0.20 },
    grossMargin:     { poor: 0.10,  excellent: 0.40 },
    operatingMargin: { poor: 0.05,  excellent: 0.22 },
    netMargin:       { poor: 0.02,  excellent: 0.15 },
    roe:             { poor: 0.03,  excellent: 0.18 },
    debtToEquity:    { poor: 1.5,   excellent: 0.2  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
  default: {
    peRatio:         { poor: 35,    excellent: 12   },
    pegRatio:        { poor: 3.0,   excellent: 0.5  },
    revenueGrowth:   { poor: 0.01,  excellent: 0.15 },
    epsGrowth:       { poor: 0.01,  excellent: 0.20 },
    grossMargin:     { poor: 0.20,  excellent: 0.55 },
    operatingMargin: { poor: 0.05,  excellent: 0.25 },
    netMargin:       { poor: 0.03,  excellent: 0.18 },
    roe:             { poor: 0.05,  excellent: 0.22 },
    debtToEquity:    { poor: 2.0,   excellent: 0.3  },
    currentRatio:    { poor: 0.8,   excellent: 2.5  },
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test src/data/sectorBenchmarks.test.ts
```
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add client/src/data/sectorBenchmarks.ts client/src/data/sectorBenchmarks.test.ts
git commit -m "feat: add sector benchmark thresholds data"
```

---

## Task 4: Scoring engine

**Files:**
- Create: `client/src/utils/scoringEngine.ts`
- Create: `client/src/utils/scoringEngine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `client/src/utils/scoringEngine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractMetricValue, scoreStock } from './scoringEngine';
import type { MetricCategory, WeightConfig } from '../types/stock';

// Minimal helper to build a StockData categories array from a flat map of label → value
function makeCategories(metrics: Record<string, number | string | null>): MetricCategory[] {
  return [{ title: 'Test', metrics: Object.entries(metrics).map(([label, value]) => ({ label, value, format: 'number' as const })) }];
}

const EQUAL_WEIGHTS: WeightConfig = {
  peRatio: 10, pegRatio: 10, revenueGrowth: 10, epsGrowth: 10,
  grossMargin: 10, operatingMargin: 10, netMargin: 10, roe: 10,
  debtToEquity: 10, currentRatio: 10,
};

describe('extractMetricValue', () => {
  it('returns the numeric value for a matching label', () => {
    const cats = makeCategories({ 'P/E Ratio': 20 });
    expect(extractMetricValue(cats, 'P/E Ratio')).toBe(20);
  });

  it('returns null for a string value', () => {
    const cats = makeCategories({ 'P/E Ratio': 'N/A' });
    expect(extractMetricValue(cats, 'P/E Ratio')).toBeNull();
  });

  it('returns null when label is not found', () => {
    const cats = makeCategories({ 'Gross Margin': 0.5 });
    expect(extractMetricValue(cats, 'P/E Ratio')).toBeNull();
  });

  it('returns null for a null value', () => {
    const cats = makeCategories({ 'P/E Ratio': null });
    expect(extractMetricValue(cats, 'P/E Ratio')).toBeNull();
  });
});

describe('scoreStock', () => {
  it('returns null when all metric values are null', () => {
    const cats: MetricCategory[] = [];
    expect(scoreStock(cats, 'Technology', EQUAL_WEIGHTS)).toBeNull();
  });

  it('returns null when all weights are 0 for available metrics', () => {
    const cats = makeCategories({ 'P/E Ratio': 20 });
    const zeroWeights: WeightConfig = {
      peRatio: 0, pegRatio: 0, revenueGrowth: 0, epsGrowth: 0,
      grossMargin: 0, operatingMargin: 0, netMargin: 0, roe: 0,
      debtToEquity: 0, currentRatio: 0,
    };
    expect(scoreStock(cats, 'Technology', zeroWeights)).toBeNull();
  });

  it('scores an excellent P/E as close to 100 (lower is better)', () => {
    // Technology excellent P/E = 15, poor = 50. A value of 15 should score ~100.
    const cats = makeCategories({ 'P/E Ratio': 15 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, peRatio: 100,
      pegRatio: 0, revenueGrowth: 0, epsGrowth: 0, grossMargin: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    const result = scoreStock(cats, 'Technology', weights);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
  });

  it('scores a poor P/E as 0 (lower is better)', () => {
    // Technology poor P/E = 50. A value of 50+ should score 0.
    const cats = makeCategories({ 'P/E Ratio': 60 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, peRatio: 100,
      pegRatio: 0, revenueGrowth: 0, epsGrowth: 0, grossMargin: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    const result = scoreStock(cats, 'Technology', weights);
    expect(result!.score).toBe(0);
  });

  it('scores an excellent gross margin as 100 (higher is better)', () => {
    // Technology excellent grossMargin = 0.70
    const cats = makeCategories({ 'Gross Margin': 0.70 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, grossMargin: 100,
      peRatio: 0, pegRatio: 0, revenueGrowth: 0, epsGrowth: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    const result = scoreStock(cats, 'Technology', weights);
    expect(result!.score).toBe(100);
  });

  it('falls back to default benchmarks for unknown sector', () => {
    const cats = makeCategories({ 'P/E Ratio': 20 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, peRatio: 100,
      pegRatio: 0, revenueGrowth: 0, epsGrowth: 0, grossMargin: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    // Should not throw; uses default benchmarks
    const result = scoreStock(cats, 'N/A', weights);
    expect(result).not.toBeNull();
  });

  it('excludes null metrics and renormalises weights', () => {
    // Only grossMargin is present. Its weight is 10/100. Other metrics are null.
    // After renormalisation, grossMargin gets 100% effective weight.
    // Excellent grossMargin (0.70) in Technology → score 100.
    const cats = makeCategories({ 'Gross Margin': 0.70 });
    const result = scoreStock(cats, 'Technology', EQUAL_WEIGHTS);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
  });

  it('maps score 80+ to Strong Buy', () => {
    const cats = makeCategories({ 'Gross Margin': 0.70 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, grossMargin: 100,
      peRatio: 0, pegRatio: 0, revenueGrowth: 0, epsGrowth: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    const result = scoreStock(cats, 'Technology', weights);
    expect(result!.recommendation).toBe('Strong Buy');
  });

  it('maps score 0 to Strong Sell', () => {
    const cats = makeCategories({ 'P/E Ratio': 999 });
    const weights: WeightConfig = { ...EQUAL_WEIGHTS, peRatio: 100,
      pegRatio: 0, revenueGrowth: 0, epsGrowth: 0, grossMargin: 0,
      operatingMargin: 0, netMargin: 0, roe: 0, debtToEquity: 0, currentRatio: 0 };
    const result = scoreStock(cats, 'Technology', weights);
    expect(result!.recommendation).toBe('Strong Sell');
  });

  it('includes category breakdown with correct titles', () => {
    const cats = makeCategories({ 'P/E Ratio': 20, 'Gross Margin': 0.5 });
    const result = scoreStock(cats, 'Technology', EQUAL_WEIGHTS);
    const titles = result!.breakdown.map(c => c.title);
    expect(titles).toContain('Valuation');
    expect(titles).toContain('Profitability');
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd client && npm test src/utils/scoringEngine.test.ts
```
Expected: FAIL — `scoringEngine.ts` does not exist

- [ ] **Step 3: Create scoringEngine.ts**

Create `client/src/utils/scoringEngine.ts`:

```ts
import type {
  MetricCategory, MetricKey, WeightConfig,
  ScoreResult, ScoringOutput, MetricScore, CategoryScore,
} from '../types/stock';
import { sectorBenchmarks } from '../data/sectorBenchmarks';

const METRIC_LABELS: Record<MetricKey, string> = {
  peRatio:         'P/E Ratio',
  pegRatio:        'PEG Ratio',
  revenueGrowth:   'Revenue Growth (YoY)',
  epsGrowth:       'EPS Growth (YoY)',
  grossMargin:     'Gross Margin',
  operatingMargin: 'Operating Margin',
  netMargin:       'Net Margin',
  roe:             'ROE',
  debtToEquity:    'Debt-to-Equity',
  currentRatio:    'Current Ratio',
};

const LOWER_IS_BETTER = new Set<MetricKey>(['peRatio', 'pegRatio', 'debtToEquity']);

const CATEGORY_METRIC_MAP: Record<string, MetricKey[]> = {
  'Growth':           ['revenueGrowth', 'epsGrowth'],
  'Valuation':        ['peRatio', 'pegRatio'],
  'Profitability':    ['grossMargin', 'operatingMargin', 'netMargin', 'roe'],
  'Financial Health': ['debtToEquity', 'currentRatio'],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function extractMetricValue(categories: MetricCategory[], label: string): number | null {
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

function computeSubScore(
  value: number,
  poor: number,
  excellent: number,
  lowerIsBetter: boolean,
): number {
  if (lowerIsBetter) {
    return clamp((poor - value) / (poor - excellent), 0, 1) * 100;
  }
  return clamp((value - poor) / (excellent - poor), 0, 1) * 100;
}

function scoreToRecommendation(score: number): ScoreResult['recommendation'] {
  if (score >= 80) return 'Strong Buy';
  if (score >= 65) return 'Buy';
  if (score >= 45) return 'Hold';
  if (score >= 30) return 'Sell';
  return 'Strong Sell';
}

export function scoreStock(
  categories: MetricCategory[],
  sector: string,
  weights: WeightConfig,
): ScoringOutput {
  const benchmarkKey = sectorBenchmarks[sector] ? sector : 'default';
  const benchmarks = sectorBenchmarks[benchmarkKey];

  const metricScores: MetricScore[] = (Object.keys(METRIC_LABELS) as MetricKey[]).map(key => {
    const label = METRIC_LABELS[key];
    const value = extractMetricValue(categories, label);
    const subScore =
      value !== null
        ? computeSubScore(value, benchmarks[key].poor, benchmarks[key].excellent, LOWER_IS_BETTER.has(key))
        : null;
    return { key, label, value, subScore, weight: weights[key] };
  });

  const activeMetrics = metricScores.filter(m => m.subScore !== null);
  const totalWeight = activeMetrics.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0) return null;

  const score = Math.round(
    activeMetrics.reduce((sum, m) => sum + m.subScore! * m.weight, 0) / totalWeight,
  );

  const breakdown: CategoryScore[] = Object.entries(CATEGORY_METRIC_MAP).map(([title, keys]) => {
    const catMetrics = metricScores.filter(m => keys.includes(m.key) && m.subScore !== null);
    const catWeight = catMetrics.reduce((sum, m) => sum + m.weight, 0);
    return {
      title,
      score:
        catWeight === 0
          ? null
          : Math.round(catMetrics.reduce((sum, m) => sum + m.subScore! * m.weight, 0) / catWeight),
    };
  });

  return { score, recommendation: scoreToRecommendation(score), breakdown, metricScores };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test src/utils/scoringEngine.test.ts
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/scoringEngine.ts client/src/utils/scoringEngine.test.ts
git commit -m "feat: implement client-side scoring engine"
```

---

## Task 5: useWeights hook

**Files:**
- Create: `client/src/hooks/useWeights.ts`
- Create: `client/src/hooks/useWeights.test.ts`

- [ ] **Step 1: Write failing tests**

Create `client/src/hooks/useWeights.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeights, rebalance, PRESETS } from './useWeights';
import type { WeightConfig, MetricKey } from '../types/stock';

// ── rebalance unit tests ────────────────────────────────────────────────────

describe('rebalance', () => {
  const base: WeightConfig = {
    revenueGrowth: 25, epsGrowth: 20, roe: 15, operatingMargin: 15,
    peRatio: 10, pegRatio: 10, debtToEquity: 5,
    grossMargin: 0, netMargin: 0, currentRatio: 0,
  };

  it('always sums to 100 after rebalance', () => {
    const result = rebalance(base, 'revenueGrowth', 40);
    const total = (Object.values(result) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('sets the changed key to the new value', () => {
    const result = rebalance(base, 'revenueGrowth', 40);
    expect(result.revenueGrowth).toBe(40);
  });

  it('does not change zero-weight keys when absorbing a delta', () => {
    const result = rebalance(base, 'revenueGrowth', 40);
    // grossMargin, netMargin, currentRatio were 0 and should stay 0
    expect(result.grossMargin).toBe(0);
    expect(result.netMargin).toBe(0);
    expect(result.currentRatio).toBe(0);
  });

  it('clamps when all other non-zero weights are 0', () => {
    const allZeroOthers: WeightConfig = {
      revenueGrowth: 100, epsGrowth: 0, roe: 0, operatingMargin: 0,
      peRatio: 0, pegRatio: 0, debtToEquity: 0,
      grossMargin: 0, netMargin: 0, currentRatio: 0,
    };
    // Trying to increase revenueGrowth when already 100 (no others to absorb)
    const result = rebalance(allZeroOthers, 'revenueGrowth', 100);
    expect(result.revenueGrowth).toBe(100);
    const total = (Object.values(result) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('returns unchanged weights when delta is 0', () => {
    const result = rebalance(base, 'revenueGrowth', 25); // same value
    expect(result).toEqual(base);
  });
});

// ── useWeights hook tests ───────────────────────────────────────────────────

describe('useWeights', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to growth preset on first load', () => {
    const { result } = renderHook(() => useWeights());
    expect(result.current.preset).toBe('growth');
    expect(result.current.lastNamedPreset).toBe('growth');
    expect(result.current.weights).toEqual(PRESETS.growth);
  });

  it('growth preset weights sum to 100', () => {
    const total = (Object.values(PRESETS.growth) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('value preset weights sum to 100', () => {
    const total = (Object.values(PRESETS.value) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('applyPreset switches to value preset', () => {
    const { result } = renderHook(() => useWeights());
    act(() => result.current.applyPreset('value'));
    expect(result.current.preset).toBe('value');
    expect(result.current.lastNamedPreset).toBe('value');
    expect(result.current.weights).toEqual(PRESETS.value);
  });

  it('setWeight sets preset to custom and updates weight', () => {
    const { result } = renderHook(() => useWeights());
    act(() => result.current.setWeight('revenueGrowth', 30));
    expect(result.current.preset).toBe('custom');
    expect(result.current.weights.revenueGrowth).toBe(30);
    const total = (Object.values(result.current.weights) as number[]).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('setWeight does not change lastNamedPreset', () => {
    const { result } = renderHook(() => useWeights());
    act(() => result.current.setWeight('revenueGrowth', 30));
    expect(result.current.lastNamedPreset).toBe('growth');
  });

  it('resetToPreset restores lastNamedPreset weights', () => {
    const { result } = renderHook(() => useWeights());
    act(() => result.current.setWeight('revenueGrowth', 30)); // goes custom
    act(() => result.current.resetToPreset());
    expect(result.current.preset).toBe('growth');
    expect(result.current.weights).toEqual(PRESETS.growth);
  });

  it('persists to localStorage on applyPreset', () => {
    const { result } = renderHook(() => useWeights());
    act(() => result.current.applyPreset('value'));
    const stored = JSON.parse(localStorage.getItem('stock-analyzer:weights')!);
    expect(stored.preset).toBe('value');
    expect(stored.lastNamedPreset).toBe('value');
  });

  it('loads persisted weights on re-render', () => {
    const { result: r1 } = renderHook(() => useWeights());
    act(() => r1.current.applyPreset('value'));

    // Simulate new hook instance (new page load)
    const { result: r2 } = renderHook(() => useWeights());
    expect(r2.current.preset).toBe('value');
    expect(r2.current.weights).toEqual(PRESETS.value);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd client && npm test src/hooks/useWeights.test.ts
```
Expected: FAIL — `useWeights.ts` does not exist

- [ ] **Step 3: Create useWeights.ts**

Create `client/src/hooks/useWeights.ts`:

```ts
import { useState, useCallback } from 'react';
import type { WeightConfig, MetricKey, ScoringPreset } from '../types/stock';

const STORAGE_KEY = 'stock-analyzer:weights';

export const PRESETS: Record<'growth' | 'value', WeightConfig> = {
  growth: {
    revenueGrowth: 25, epsGrowth: 20, roe: 15, operatingMargin: 15,
    peRatio: 10, pegRatio: 10, debtToEquity: 5,
    grossMargin: 0, netMargin: 0, currentRatio: 0,
  },
  value: {
    peRatio: 25, netMargin: 20, debtToEquity: 20, currentRatio: 15,
    roe: 10, grossMargin: 10,
    revenueGrowth: 0, epsGrowth: 0, operatingMargin: 0, pegRatio: 0,
  },
};

interface StoredWeights {
  preset: ScoringPreset;
  lastNamedPreset: 'growth' | 'value';
  weights: WeightConfig;
}

function loadFromStorage(): StoredWeights | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredWeights;
  } catch {
    return null;
  }
}

function saveToStorage(data: StoredWeights): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable — in-memory only for this session
  }
}

/** Exported for unit testing. */
export function rebalance(weights: WeightConfig, changedKey: MetricKey, newValue: number): WeightConfig {
  const oldValue = weights[changedKey];
  const delta = newValue - oldValue;
  if (delta === 0) return weights;

  const otherNonZeroKeys = (Object.keys(weights) as MetricKey[]).filter(
    k => k !== changedKey && weights[k] > 0,
  );

  // Clamp: can't increase if nothing else to absorb the delta
  if (delta > 0 && otherNonZeroKeys.length === 0) return weights;

  const totalOfOthers = otherNonZeroKeys.reduce((sum, k) => sum + weights[k], 0);
  const updated: WeightConfig = { ...weights, [changedKey]: newValue };

  for (const k of otherNonZeroKeys) {
    updated[k] = weights[k] - delta * (weights[k] / totalOfOthers);
  }

  // Round to integers
  const rounded = {} as WeightConfig;
  for (const k of Object.keys(updated) as MetricKey[]) {
    rounded[k] = Math.round(updated[k]);
  }

  // Fix rounding error: adjust largest non-zero weight (excluding the changed key)
  const total = (Object.values(rounded) as number[]).reduce((a, b) => a + b, 0);
  if (total !== 100 && otherNonZeroKeys.length > 0) {
    const diff = 100 - total;
    const largestKey = otherNonZeroKeys.reduce(
      (max, k) => rounded[k] > rounded[max] ? k : max,
      otherNonZeroKeys[0],
    );
    rounded[largestKey] += diff;
  }

  return rounded;
}

export interface UseWeightsReturn {
  weights: WeightConfig;
  preset: ScoringPreset;
  lastNamedPreset: 'growth' | 'value';
  setWeight: (key: MetricKey, value: number) => void;
  applyPreset: (preset: 'growth' | 'value') => void;
  resetToPreset: () => void;
}

export function useWeights(): UseWeightsReturn {
  const [state, setState] = useState<StoredWeights>(() => {
    const stored = loadFromStorage();
    return stored ?? { preset: 'growth', lastNamedPreset: 'growth', weights: { ...PRESETS.growth } };
  });

  const setWeight = useCallback((key: MetricKey, value: number) => {
    setState(prev => {
      const next: StoredWeights = {
        ...prev,
        preset: 'custom',
        weights: rebalance(prev.weights, key, value),
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: 'growth' | 'value') => {
    setState(() => {
      const next: StoredWeights = {
        preset,
        lastNamedPreset: preset,
        weights: { ...PRESETS[preset] },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetToPreset = useCallback(() => {
    setState(prev => {
      const next: StoredWeights = {
        preset: prev.lastNamedPreset,
        lastNamedPreset: prev.lastNamedPreset,
        weights: { ...PRESETS[prev.lastNamedPreset] },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  return { weights: state.weights, preset: state.preset, lastNamedPreset: state.lastNamedPreset, setWeight, applyPreset, resetToPreset };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test src/hooks/useWeights.test.ts
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useWeights.ts client/src/hooks/useWeights.test.ts
git commit -m "feat: implement useWeights hook with localStorage persistence"
```

---

## Task 6: WeightEditor component

**Files:**
- Create: `client/src/components/ScorePanel/WeightEditor.tsx`
- Create: `client/src/components/ScorePanel/WeightEditor.module.css`

- [ ] **Step 1: Create WeightEditor.tsx**

Create `client/src/components/ScorePanel/WeightEditor.tsx`:

```tsx
import type { MetricKey, WeightConfig } from '../../types/stock';
import styles from './WeightEditor.module.css';

const METRIC_DISPLAY_LABELS: Record<MetricKey, string> = {
  revenueGrowth:   'Rev Growth',
  epsGrowth:       'EPS Growth',
  roe:             'ROE',
  operatingMargin: 'Op Margin',
  peRatio:         'P/E Ratio',
  pegRatio:        'PEG Ratio',
  debtToEquity:    'Debt/Equity',
  grossMargin:     'Gross Margin',
  netMargin:       'Net Margin',
  currentRatio:    'Current Ratio',
};

const METRIC_ORDER: MetricKey[] = [
  'revenueGrowth', 'epsGrowth', 'roe', 'operatingMargin',
  'peRatio', 'pegRatio', 'debtToEquity', 'grossMargin', 'netMargin', 'currentRatio',
];

interface WeightEditorProps {
  weights: WeightConfig;
  lastNamedPreset: 'growth' | 'value';
  onSetWeight: (key: MetricKey, value: number) => void;
  onReset: () => void;
}

export function WeightEditor({ weights, lastNamedPreset, onSetWeight, onReset }: WeightEditorProps) {
  return (
    <div className={styles.editor}>
      <div className={styles.hint}>Drag to rebalance · Total: 100% ✓</div>
      {METRIC_ORDER.map(key => (
        <div key={key} className={`${styles.row} ${weights[key] === 0 ? styles.zero : ''}`}>
          <span className={styles.label}>{METRIC_DISPLAY_LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={e => onSetWeight(key, Number(e.target.value))}
            className={styles.slider}
            aria-label={`${METRIC_DISPLAY_LABELS[key]} weight`}
          />
          <span className={styles.value}>{weights[key]}%</span>
        </div>
      ))}
      <button className={styles.resetBtn} onClick={onReset}>
        Reset to {lastNamedPreset === 'growth' ? 'Growth' : 'Value'} preset
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create WeightEditor.module.css**

Create `client/src/components/ScorePanel/WeightEditor.module.css`:

```css
.editor {
  margin-top: 10px;
  padding: 10px;
  background: #0c1520;
  border-radius: 4px;
  border: 1px solid #1a2a3e;
}

.hint {
  font-size: 9px;
  color: #4ade80;
  margin-bottom: 8px;
  text-align: center;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.zero {
  opacity: 0.45;
}

.label {
  font-size: 9px;
  color: #888;
  min-width: 66px;
  flex-shrink: 0;
}

.slider {
  flex: 1;
  height: 3px;
  cursor: pointer;
  accent-color: #4a9eff;
}

.value {
  font-size: 9px;
  color: #aaa;
  min-width: 28px;
  text-align: right;
}

.resetBtn {
  margin-top: 8px;
  width: 100%;
  background: #111;
  border: 1px solid #1a2a3e;
  color: #888;
  font-size: 9px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.resetBtn:hover {
  background: #1a1a2e;
  color: #aaa;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ScorePanel/WeightEditor.tsx client/src/components/ScorePanel/WeightEditor.module.css
git commit -m "feat: add WeightEditor component with metric weight sliders"
```

---

## Task 7: ScorePanel component

**Files:**
- Create: `client/src/components/ScorePanel/ScorePanel.tsx`
- Create: `client/src/components/ScorePanel/ScorePanel.module.css`
- Create: `client/src/components/ScorePanel/ScorePanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/ScorePanel/ScorePanel.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScorePanel } from './ScorePanel';
import type { StockData } from '../../types/stock';

function makeStockData(overrides: Partial<StockData> = {}): StockData {
  return {
    profile: { name: 'Apple Inc.', ticker: 'AAPL', sector: 'Technology', industry: 'Consumer Electronics', description: '', price: 182 },
    categories: [
      {
        title: 'Profitability',
        metrics: [
          { label: 'Gross Margin', value: 0.70, format: 'percent' },
          { label: 'Operating Margin', value: 0.30, format: 'percent' },
          { label: 'Net Margin', value: 0.25, format: 'percent' },
          { label: 'ROE', value: 0.35, format: 'percent' },
        ],
      },
    ],
    dataAsOf: new Date().toISOString(),
    cached: false,
    ...overrides,
  };
}

describe('ScorePanel', () => {
  beforeEach(() => localStorage.clear());

  it('renders without crashing', () => {
    render(<ScorePanel stockData={makeStockData()} />);
  });

  it('shows a score number between 0 and 100', () => {
    render(<ScorePanel stockData={makeStockData()} />);
    const scoreEl = screen.getByTestId('score-number');
    const score = Number(scoreEl.textContent);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('shows a recommendation', () => {
    render(<ScorePanel stockData={makeStockData()} />);
    const rec = screen.getByTestId('recommendation');
    const validRecs = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
    expect(validRecs).toContain(rec.textContent);
  });

  it('shows "Insufficient Data" when no metrics match', () => {
    const emptyData = makeStockData({ categories: [] });
    render(<ScorePanel stockData={emptyData} />);
    expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();
  });

  it('shows Growth and Value preset buttons', () => {
    render(<ScorePanel stockData={makeStockData()} />);
    expect(screen.getByRole('button', { name: /growth/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /value/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd client && npm test src/components/ScorePanel/ScorePanel.test.tsx
```
Expected: FAIL — `ScorePanel.tsx` does not exist

- [ ] **Step 3: Create ScorePanel.tsx**

Create `client/src/components/ScorePanel/ScorePanel.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { StockData, ScoringOutput } from '../../types/stock';
import { scoreStock } from '../../utils/scoringEngine';
import { useWeights } from '../../hooks/useWeights';
import { WeightEditor } from './WeightEditor';
import styles from './ScorePanel.module.css';

const REC_COLORS: Record<string, string> = {
  'Strong Buy':  '#4ade80',
  'Buy':         '#86efac',
  'Hold':        '#facc15',
  'Sell':        '#fb923c',
  'Strong Sell': '#f87171',
};

function barColor(score: number): string {
  if (score >= 65) return '#4ade80';
  if (score >= 45) return '#facc15';
  return '#f87171';
}

interface ScorePanelProps {
  stockData: StockData;
}

export function ScorePanel({ stockData }: ScorePanelProps) {
  const { weights, preset, lastNamedPreset, setWeight, applyPreset, resetToPreset } = useWeights();
  const [showWeights, setShowWeights] = useState(false);

  const result: ScoringOutput = useMemo(
    () => scoreStock(stockData.categories, stockData.profile.sector, weights),
    [stockData, weights],
  );

  if (!result) {
    return (
      <div className={styles.panel}>
        <div className={styles.noData}>Not enough data to score this stock.</div>
      </div>
    );
  }

  const recColor = REC_COLORS[result.recommendation] ?? '#aaa';

  return (
    <div className={styles.panel}>
      {/* Preset toggle */}
      <div className={styles.presets}>
        {(['growth', 'value'] as const).map(p => (
          <button
            key={p}
            className={`${styles.presetBtn} ${(preset === p || (preset === 'custom' && lastNamedPreset === p)) ? styles.active : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p === 'growth' ? 'Growth' : 'Value'}
          </button>
        ))}
      </div>

      {/* Score */}
      <div className={styles.scoreDisplay}>
        <div className={styles.scoreLabel}>Stock Score</div>
        <div className={styles.scoreNumber} style={{ color: recColor }} data-testid="score-number">
          {result.score}
        </div>
        <div className={styles.scoreOutOf}>out of 100</div>
        <div className={styles.badge} style={{ color: recColor, borderColor: recColor }} data-testid="recommendation">
          {result.recommendation}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${result.score}%` }} />
      </div>
      <div className={styles.progressLabels}>
        <span>Sell</span><span>Hold</span><span>Buy</span>
      </div>

      {/* Category breakdown */}
      <div className={styles.breakdown}>
        <div className={styles.breakdownLabel}>Breakdown</div>
        {result.breakdown.map(cat => (
          <div key={cat.title} className={styles.breakdownRow}>
            <span className={styles.catName}>{cat.title}</span>
            {cat.score !== null ? (
              <>
                <span className={styles.catScore} style={{ color: barColor(cat.score) }}>
                  {cat.score}
                </span>
                <div className={styles.catBar}>
                  <div
                    className={styles.catBarFill}
                    style={{ width: `${cat.score}%`, backgroundColor: barColor(cat.score) }}
                  />
                </div>
              </>
            ) : (
              <span className={styles.catScore}>—</span>
            )}
          </div>
        ))}
      </div>

      {/* Weight editor toggle */}
      <button className={styles.adjustBtn} onClick={() => setShowWeights(v => !v)}>
        ⚙ {showWeights ? 'Hide weights' : 'Adjust weights'}
      </button>

      {showWeights && (
        <WeightEditor
          weights={weights}
          lastNamedPreset={lastNamedPreset}
          onSetWeight={setWeight}
          onReset={resetToPreset}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ScorePanel.module.css**

Create `client/src/components/ScorePanel/ScorePanel.module.css`:

```css
.panel {
  background: #080d14;
  border: 1px solid #1a2a3e;
  border-radius: 8px;
  padding: 12px;
  font-family: inherit;
}

.noData {
  font-size: 11px;
  color: #666;
  text-align: center;
  padding: 24px 0;
}

/* Preset toggle */
.presets {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.presetBtn {
  flex: 1;
  padding: 5px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #1a1a1a;
  background: #111;
  color: #666;
  transition: background 0.15s, color 0.15s;
}

.presetBtn.active {
  background: #1a3a2e;
  color: #4ade80;
  border-color: #2a5a3e;
}

/* Score display */
.scoreDisplay {
  text-align: center;
  margin-bottom: 10px;
}

.scoreLabel {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.scoreNumber {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}

.scoreOutOf {
  font-size: 9px;
  color: #555;
  margin-bottom: 6px;
}

.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid;
}

/* Progress bar */
.progressBar {
  height: 6px;
  background: #111;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 3px;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #f87171, #facc15, #4ade80);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progressLabels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #444;
  margin-bottom: 12px;
}

/* Breakdown */
.breakdown {
  margin-bottom: 10px;
}

.breakdownLabel {
  font-size: 9px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.breakdownRow {
  display: grid;
  grid-template-columns: 80px 24px 1fr;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.catName {
  font-size: 9px;
  color: #888;
}

.catScore {
  font-size: 9px;
  font-weight: 600;
  text-align: right;
}

.catBar {
  height: 3px;
  background: #111;
  border-radius: 2px;
  overflow: hidden;
}

.catBarFill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Adjust weights button */
.adjustBtn {
  width: 100%;
  background: none;
  border: none;
  color: #4a9eff;
  font-size: 10px;
  cursor: pointer;
  padding: 4px 0;
  border-top: 1px solid #1a1a1a;
}

.adjustBtn:hover {
  color: #60b0ff;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd client && npm test src/components/ScorePanel/ScorePanel.test.tsx
```
Expected: `5 passed`

- [ ] **Step 6: Run all tests to confirm nothing broken**

```bash
cd client && npm test
```
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ScorePanel/
git commit -m "feat: add ScorePanel component with score display and breakdown"
```

---

## Task 8: Two-column dashboard layout

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/App.module.css`

- [ ] **Step 1: Update App.tsx to add ScorePanel in sidebar**

Replace full contents of `client/src/App.tsx`:

```tsx
import { SearchBar } from './components/SearchBar/SearchBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ScorePanel } from './components/ScorePanel/ScorePanel';
import { ErrorMessage } from './components/ErrorMessage/ErrorMessage';
import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';
import { useStockData } from './hooks/useStockData';
import styles from './App.module.css';

function App() {
  const { data, quarterlyData, loading, error, lookup } = useStockData();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Stock Analyzer</h1>
        <p className={styles.subtitle}>Look up any stock and see its fundamentals at a glance</p>
      </header>
      <main className={styles.main}>
        <SearchBar onSearch={lookup} loading={loading} />
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        {data && (
          <div className={styles.dashboardLayout}>
            <div className={styles.mainContent}>
              <Dashboard data={data} quarterlyData={quarterlyData} />
            </div>
            <div className={styles.scoreSidebar}>
              <ScorePanel stockData={data} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Update App.module.css with two-column grid**

Replace full contents of `client/src/App.module.css`:

```css
.app {
  min-height: 100vh;
  background: #f1f5f9;
}

.header {
  text-align: center;
  padding: 2rem 1rem 1rem;
}

.title {
  margin: 0;
  font-size: 1.75rem;
  color: #1e293b;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.main {
  padding: 1.5rem 1rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Two-column layout: dashboard left, score panel right */
.dashboardLayout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 1.5rem;
  align-items: start;
}

.mainContent {
  min-width: 0; /* prevents grid blowout */
}

.scoreSidebar {
  position: sticky;
  top: 1rem;
}

@media (max-width: 768px) {
  .dashboardLayout {
    grid-template-columns: 1fr;
  }

  .scoreSidebar {
    position: static;
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Run all tests one final time**

```bash
cd client && npm test
```
Expected: all tests pass

- [ ] **Step 5: Start dev server and manual smoke test**

```bash
cd "/Users/senthil/Desktop/Claude-Stock Analyzer/stock-analyzer" && npm run dev
```

Open http://localhost:5173, search for `AAPL`, and verify:
1. Score panel appears in a sidebar to the right of the metrics
2. A score number (0–100) and recommendation badge are shown
3. Category breakdown rows (Growth, Valuation, Profitability, Financial Health) appear
4. Growth / Value preset buttons switch the score
5. "Adjust weights" expands the slider editor
6. Dragging a slider updates the score in real time
7. Reload the page — weight customisations are preserved
8. On a narrow browser window (< 768px), sidebar stacks below the company header

- [ ] **Step 6: Commit**

```bash
git add client/src/App.tsx client/src/App.module.css
git commit -m "feat: two-column dashboard layout with sticky ScorePanel sidebar"
```

---

## Done

All 8 tasks complete. The scoring engine is live: sector-relative benchmarks, Growth/Value presets, user-adjustable weights persisted in localStorage, and a sticky ScorePanel sidebar that recalculates instantly on any weight change.

Next: Feature 2b — Buy/Hold/Sell recommendation narrative and change highlights.

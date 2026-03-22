export interface CompanyProfile {
  name: string;
  ticker: string;
  sector: string;
  industry: string;
  description: string;
  price: number | null;
}

export interface MetricValue {
  label: string;
  value: number | string | null;
  format: 'currency' | 'largeCurrency' | 'percent' | 'number' | 'ratio';
}

export interface MetricCategory {
  title: string;
  metrics: MetricValue[];
}

export interface StockData {
  profile: CompanyProfile;
  categories: MetricCategory[];
  dataAsOf: string;
  cached: boolean;
}

export interface StockError {
  error: string;
  ticker: string;
}

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

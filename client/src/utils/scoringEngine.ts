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

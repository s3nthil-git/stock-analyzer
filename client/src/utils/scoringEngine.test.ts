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

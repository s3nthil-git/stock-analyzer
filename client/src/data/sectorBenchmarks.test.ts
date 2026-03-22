import { describe, it, expect } from 'vitest';
import type { MetricKey } from '../types/stock';
import { sectorBenchmarks } from './sectorBenchmarks';

describe('sectorBenchmarks', () => {
  const ALL_METRIC_KEYS: MetricKey[] = [
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

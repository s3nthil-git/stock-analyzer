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

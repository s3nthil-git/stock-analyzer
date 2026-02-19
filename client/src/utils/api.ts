import type { StockData } from '../types/stock';
import type { QuarterlyData } from '../types/quarterly';

const BASE_URL = '/api';

export async function fetchStockData(ticker: string): Promise<StockData> {
  const res = await fetch(`${BASE_URL}/stock/${encodeURIComponent(ticker)}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch stock data' }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchQuarterlyData(ticker: string): Promise<QuarterlyData | null> {
  const res = await fetch(`${BASE_URL}/stock/${encodeURIComponent(ticker)}/quarterly`);

  if (!res.ok) {
    return null;
  }

  return res.json();
}

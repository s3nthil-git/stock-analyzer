import { useState, useCallback } from 'react';
import type { StockData } from '../types/stock';
import { fetchStockData } from '../utils/api';

export function useStockData() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (ticker: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchStockData(ticker);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lookup };
}

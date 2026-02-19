import { useState, useCallback } from 'react';
import type { StockData } from '../types/stock';
import type { QuarterlyData } from '../types/quarterly';
import { fetchStockData, fetchQuarterlyData } from '../utils/api';

export function useStockData() {
  const [data, setData] = useState<StockData | null>(null);
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (ticker: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setQuarterlyData(null);
    try {
      const [stockResult, quarterlyResult] = await Promise.all([
        fetchStockData(ticker),
        fetchQuarterlyData(ticker).catch(() => null),
      ]);
      setData(stockResult);
      setQuarterlyData(quarterlyResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, quarterlyData, loading, error, lookup };
}

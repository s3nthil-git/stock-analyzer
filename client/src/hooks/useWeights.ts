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

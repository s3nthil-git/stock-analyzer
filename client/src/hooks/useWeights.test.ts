import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeights, rebalance, PRESETS } from './useWeights';
import type { WeightConfig } from '../types/stock';

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

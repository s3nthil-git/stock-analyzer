export function formatLargeCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num)) return 'N/A';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num)) return 'N/A';
  return `$${num.toFixed(2)}`;
}

export function formatPercent(value: number | string | null): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

export function formatRatio(value: number | string | null): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num)) return 'N/A';
  return num.toFixed(2);
}

export function formatNumber(value: number | string | null): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num)) return 'N/A';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatMetricValue(value: number | string | null, format: string): string {
  switch (format) {
    case 'currency': return formatCurrency(value);
    case 'largeCurrency': return formatLargeCurrency(value);
    case 'percent': return formatPercent(value);
    case 'ratio': return formatRatio(value);
    case 'number': return formatNumber(value);
    default: return value?.toString() ?? 'N/A';
  }
}

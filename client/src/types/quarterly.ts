export interface QuarterValue {
  period: string;
  value: number | null;
  changePercent: number | null;
  direction: 'up' | 'down' | 'flat' | null;
}

export interface QuarterMetric {
  label: string;
  format: 'currency' | 'largeCurrency' | 'percent' | 'ratio';
  lowerIsBetter: boolean;
  quarters: QuarterValue[];
}

export interface QuarterlyData {
  ticker: string;
  metrics: QuarterMetric[];
  dataAsOf: string;
  cached: boolean;
}

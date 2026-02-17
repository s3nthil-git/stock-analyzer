export interface CompanyProfile {
  name: string;
  ticker: string;
  sector: string;
  industry: string;
  description: string;
  price: number | null;
}

export interface MetricValue {
  label: string;
  value: number | string | null;
  format: 'currency' | 'largeCurrency' | 'percent' | 'number' | 'ratio';
}

export interface MetricCategory {
  title: string;
  metrics: MetricValue[];
}

export interface StockData {
  profile: CompanyProfile;
  categories: MetricCategory[];
  dataAsOf: string;
  cached: boolean;
}

export interface StockError {
  error: string;
  ticker: string;
}

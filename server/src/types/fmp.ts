export interface FMPProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  price: number;
  marketCap: number;
  averageVolume: number;
  range: string;
  exchange: string;
  [key: string]: unknown;
}

export interface FMPKeyMetrics {
  returnOnEquity: number | null;
  currentRatio: number | null;
  [key: string]: unknown;
}

export interface FMPRatios {
  priceToEarningsRatio: number | null;
  priceToEarningsGrowthRatio: number | null;
  priceToBookRatio: number | null;
  priceToSalesRatio: number | null;
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  netProfitMargin: number | null;
  currentRatio: number | null;
  debtToEquityRatio: number | null;
  dividendYield: number | null;
  dividendPayoutRatio: number | null;
  netIncomePerShare: number | null;
  revenuePerShare: number | null;
  freeCashFlowPerShare: number | null;
  forwardPriceToEarningsGrowthRatio: number | null;
  [key: string]: unknown;
}

export interface FMPRSIEntry {
  rsi: number;
  date: string;
  [key: string]: unknown;
}

export interface FMPIncomeStatement {
  period: string;
  fiscalYear: string;
  revenue: number | null;
  epsDiluted: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  [key: string]: unknown;
}

export interface FMPBalanceSheet {
  period: string;
  fiscalYear: string;
  totalDebt: number | null;
  totalStockholdersEquity: number | null;
  [key: string]: unknown;
}

export interface FMPCashFlow {
  period: string;
  fiscalYear: string;
  freeCashFlow: number | null;
  [key: string]: unknown;
}

export interface FMPIncomeGrowthQuarterly {
  period: string;
  fiscalYear: string;
  growthRevenue: number | null;
  [key: string]: unknown;
}

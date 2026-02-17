import axios from 'axios';
import { cacheService } from './cacheService';
import { StockData, MetricCategory } from '../types/stock';
import { FMPProfile, FMPKeyMetrics, FMPRatios, FMPRSIEntry } from '../types/fmp';

const BASE_URL = 'https://financialmodelingprep.com/stable';
const REQUEST_TIMEOUT = 5000;

function getApiKey(): string {
  return process.env.FMP_API_KEY || '';
}

const SUPPORTED_EXCHANGES = ['NYSE', 'NASDAQ'];

class FMPError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'FMPError';
  }
}

async function fmpGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const response = await axios.get(`${BASE_URL}${path}`, {
    params: { ...params, apikey: getApiKey() },
    timeout: REQUEST_TIMEOUT,
  });

  if (response.status === 429) {
    throw new FMPError('API rate limit reached. Please try again later.', 429);
  }

  return response.data;
}

function safeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isFinite(n) ? n : null;
}

interface FMPGrowth {
  growthRevenue: number | null;
  growthEPSDiluted: number | null;
  [key: string]: unknown;
}

function buildCategories(
  profile: FMPProfile,
  keyMetrics: FMPKeyMetrics,
  ratios: FMPRatios,
  growth: FMPGrowth,
  rsi: number | null
): MetricCategory[] {
  return [
    {
      title: 'Valuation',
      metrics: [
        { label: 'P/E Ratio', value: safeNum(ratios.priceToEarningsRatio), format: 'ratio' },
        { label: 'Forward P/E', value: safeNum(ratios.forwardPriceToEarningsGrowthRatio), format: 'ratio' },
        { label: 'PEG Ratio', value: safeNum(ratios.priceToEarningsGrowthRatio), format: 'ratio' },
        { label: 'Price-to-Book', value: safeNum(ratios.priceToBookRatio), format: 'ratio' },
        { label: 'Price-to-Sales', value: safeNum(ratios.priceToSalesRatio), format: 'ratio' },
      ],
    },
    {
      title: 'Profitability',
      metrics: [
        { label: 'EPS', value: safeNum(ratios.netIncomePerShare), format: 'currency' },
        { label: 'Revenue/Share', value: safeNum(ratios.revenuePerShare), format: 'currency' },
        { label: 'Gross Margin', value: safeNum(ratios.grossProfitMargin), format: 'percent' },
        { label: 'Operating Margin', value: safeNum(ratios.operatingProfitMargin), format: 'percent' },
        { label: 'Net Margin', value: safeNum(ratios.netProfitMargin), format: 'percent' },
        { label: 'ROE', value: safeNum(keyMetrics.returnOnEquity), format: 'percent' },
      ],
    },
    {
      title: 'Growth',
      metrics: [
        { label: 'Revenue Growth (YoY)', value: safeNum(growth.growthRevenue), format: 'percent' },
        { label: 'EPS Growth (YoY)', value: safeNum(growth.growthEPSDiluted), format: 'percent' },
      ],
    },
    {
      title: 'Financial Health',
      metrics: [
        { label: 'Debt-to-Equity', value: safeNum(ratios.debtToEquityRatio), format: 'ratio' },
        { label: 'Current Ratio', value: safeNum(ratios.currentRatio), format: 'ratio' },
        { label: 'Free Cash Flow/Share', value: safeNum(ratios.freeCashFlowPerShare), format: 'currency' },
      ],
    },
    {
      title: 'Dividends',
      metrics: [
        { label: 'Dividend Yield', value: safeNum(ratios.dividendYield), format: 'percent' },
        { label: 'Payout Ratio', value: safeNum(ratios.dividendPayoutRatio), format: 'percent' },
      ],
    },
    {
      title: 'Market Data',
      metrics: [
        { label: 'Market Cap', value: safeNum(profile.marketCap), format: 'largeCurrency' },
        { label: '52-Week High', value: parseRangeHigh(profile.range), format: 'currency' },
        { label: '52-Week Low', value: parseRangeLow(profile.range), format: 'currency' },
        { label: 'Avg Volume', value: safeNum(profile.averageVolume), format: 'number' },
      ],
    },
    {
      title: 'Technical',
      metrics: [
        { label: 'RSI (14-day)', value: rsi, format: 'ratio' },
      ],
    },
  ];
}

function parseRangeHigh(range: string): number | null {
  if (!range) return null;
  const parts = range.split('-');
  return parts.length === 2 ? safeNum(parts[1].trim()) : null;
}

function parseRangeLow(range: string): number | null {
  if (!range) return null;
  const parts = range.split('-');
  return parts.length === 2 ? safeNum(parts[0].trim()) : null;
}

export async function getStockData(ticker: string): Promise<StockData> {
  const cacheKey = `stock_${ticker}`;
  const cached = cacheService.get<StockData>(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const [profileData, keyMetricsData, ratiosData, growthData, rsiData] = await Promise.all([
    fmpGet<FMPProfile[]>(`/profile`, { symbol: ticker }),
    fmpGet<FMPKeyMetrics[]>(`/key-metrics`, { symbol: ticker, limit: '1' }),
    fmpGet<FMPRatios[]>(`/ratios`, { symbol: ticker, limit: '1' }),
    fmpGet<FMPGrowth[]>(`/income-statement-growth`, { symbol: ticker, limit: '1' }).catch(() => []),
    fmpGet<FMPRSIEntry[]>(`/technical-indicators/rsi`, { symbol: ticker, periodLength: '14', timeframe: '1day' }).catch(() => []),
  ]);

  if (!profileData || profileData.length === 0) {
    throw new FMPError('Ticker not found', 404);
  }

  const profile = profileData[0];

  const exchange = profile.exchange || '';
  if (!SUPPORTED_EXCHANGES.some(e => exchange.toUpperCase().includes(e))) {
    throw new FMPError(
      `${ticker} is listed on ${exchange || 'an unsupported exchange'}. Only NYSE and NASDAQ stocks are supported.`,
      400
    );
  }

  const keyMetrics = keyMetricsData?.[0] || {} as FMPKeyMetrics;
  const ratios = ratiosData?.[0] || {} as FMPRatios;
  const growth = growthData?.[0] || {} as FMPGrowth;
  const rsi = rsiData?.[0] ? safeNum(rsiData[0].rsi) : null;

  const stockData: StockData = {
    profile: {
      name: profile.companyName,
      ticker: profile.symbol,
      sector: profile.sector || 'N/A',
      industry: profile.industry || 'N/A',
      description: profile.description || '',
      price: safeNum(profile.price),
    },
    categories: buildCategories(profile, keyMetrics, ratios, growth, rsi),
    dataAsOf: new Date().toISOString(),
    cached: false,
  };

  cacheService.set(cacheKey, stockData);
  return stockData;
}

export { FMPError };

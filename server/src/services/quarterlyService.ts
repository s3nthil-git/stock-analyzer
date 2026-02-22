import { cacheService } from './cacheService';
import { fmpGet, safeNum, FMPError } from './fmpService';
import {
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlow,
  FMPIncomeGrowthQuarterly,
} from '../types/fmp';
import { QuarterlyData, QuarterMetric, QuarterValue } from '../types/quarterly';

interface RawQuarterData {
  period: string;
  revenue: number | null;
  eps: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
  freeCashFlow: number | null;
  revenueGrowth: number | null;
}

function buildPeriodLabel(period: string, fiscalYear: string): string {
  return `${period} ${fiscalYear}`;
}

function safeRatio(numerator: unknown, denominator: unknown): number | null {
  const num = safeNum(numerator);
  const den = safeNum(denominator);
  if (num === null || den === null || den === 0) return null;
  return num / den;
}

function computeQoQChanges(values: (number | null)[]): QuarterValue[] {
  return values.map((value, i) => {
    if (i === 0 || value === null || values[i - 1] === null) {
      return { period: '', value, changePercent: null, direction: null };
    }
    const prev = values[i - 1]!;
    if (prev === 0) {
      return { period: '', value, changePercent: null, direction: null };
    }
    const changePercent = ((value - prev) / Math.abs(prev)) * 100;
    const direction = changePercent > 0.005 ? 'up' as const
      : changePercent < -0.005 ? 'down' as const
      : 'flat' as const;
    return { period: '', value, changePercent: Math.round(changePercent * 100) / 100, direction };
  });
}

function buildMetric(
  label: string,
  format: QuarterMetric['format'],
  lowerIsBetter: boolean,
  quarters: RawQuarterData[],
  extractor: (q: RawQuarterData) => number | null
): QuarterMetric {
  const values = quarters.map(extractor);
  const qoq = computeQoQChanges(values);

  return {
    label,
    format,
    lowerIsBetter,
    quarters: qoq.map((q, i) => ({
      ...q,
      period: quarters[i].period,
    })),
  };
}

export async function getQuarterlyData(ticker: string): Promise<QuarterlyData> {
  const cacheKey = `quarterly_${ticker}`;
  const cached = cacheService.get<QuarterlyData>(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const [incomeData, balanceData, cashFlowData, growthData] = await Promise.all([
    fmpGet<FMPIncomeStatement[]>('/income-statement', { symbol: ticker, period: 'quarter', limit: '4' }).catch(() => []),
    fmpGet<FMPBalanceSheet[]>('/balance-sheet-statement', { symbol: ticker, period: 'quarter', limit: '4' }).catch(() => []),
    fmpGet<FMPCashFlow[]>('/cash-flow-statement', { symbol: ticker, period: 'quarter', limit: '4' }).catch(() => []),
    fmpGet<FMPIncomeGrowthQuarterly[]>('/income-statement-growth', { symbol: ticker, period: 'quarter', limit: '4' }).catch(() => []),
  ]);

  if (!incomeData || incomeData.length === 0) {
    throw new FMPError('Quarterly data not available for this ticker', 404);
  }

  // FMP returns newest first — reverse to chronological order (oldest first)
  const income = [...incomeData].reverse();
  const balance = [...balanceData].reverse();
  const cashFlow = [...cashFlowData].reverse();
  const growth = [...growthData].reverse();

  // Build a map of balance sheet and cash flow by period label for alignment
  const balanceMap = new Map(balance.map(b => [buildPeriodLabel(b.period, b.fiscalYear), b]));
  const cashFlowMap = new Map(cashFlow.map(c => [buildPeriodLabel(c.period, c.fiscalYear), c]));
  const growthMap = new Map(growth.map(g => [buildPeriodLabel(g.period, g.fiscalYear), g]));

  // Build unified quarter rows keyed off income statement periods
  const quarters: RawQuarterData[] = income.map(inc => {
    const periodLabel = buildPeriodLabel(inc.period, inc.fiscalYear);
    const bal = balanceMap.get(periodLabel);
    const cf = cashFlowMap.get(periodLabel);
    const gr = growthMap.get(periodLabel);

    const totalDebt = bal ? safeNum(bal.totalDebt) : null;
    const equity = bal ? safeNum(bal.totalStockholdersEquity) : null;
    const debtToEquity = totalDebt !== null && equity !== null && equity !== 0
      ? totalDebt / equity
      : null;

    return {
      period: periodLabel,
      revenue: safeNum(inc.revenue),
      eps: safeNum(inc.epsDiluted),
      grossMargin: safeRatio(inc.grossProfit, inc.revenue),
      operatingMargin: safeRatio(inc.operatingIncome, inc.revenue),
      netMargin: safeRatio(inc.netIncome, inc.revenue),
      debtToEquity,
      freeCashFlow: cf ? safeNum(cf.freeCashFlow) : null,
      revenueGrowth: gr ? safeNum(gr.growthRevenue) : null,
    };
  });

  const metrics: QuarterMetric[] = [
    buildMetric('Revenue', 'largeCurrency', false, quarters, q => q.revenue),
    buildMetric('EPS', 'currency', false, quarters, q => q.eps),
    buildMetric('Gross Margin', 'percent', false, quarters, q => q.grossMargin),
    buildMetric('Operating Margin', 'percent', false, quarters, q => q.operatingMargin),
    buildMetric('Net Margin', 'percent', false, quarters, q => q.netMargin),
    buildMetric('Free Cash Flow', 'largeCurrency', false, quarters, q => q.freeCashFlow),
    buildMetric('Revenue Growth (YoY)', 'percent', false, quarters, q => q.revenueGrowth),
    buildMetric('Debt-to-Equity', 'ratio', true, quarters, q => q.debtToEquity),
  ];

  const result: QuarterlyData = {
    ticker,
    metrics,
    dataAsOf: new Date().toISOString(),
    cached: false,
  };

  cacheService.set(cacheKey, result);
  return result;
}

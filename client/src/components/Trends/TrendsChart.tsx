import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { QuarterMetric } from '../../types/quarterly';
import { formatMetricValue } from '../../utils/formatters';
import styles from './TrendsChart.module.css';

interface TrendsChartProps {
  metrics: QuarterMetric[];
}

function getTrendColor(metric: QuarterMetric): string {
  const values = metric.quarters.map(q => q.value).filter((v): v is number => v !== null);
  if (values.length < 2) return '#64748b';

  const first = values[0];
  const last = values[values.length - 1];
  const improving = metric.lowerIsBetter ? last < first : last > first;

  return improving ? '#16a34a' : '#dc2626';
}

export function TrendsChart({ metrics }: TrendsChartProps) {
  return (
    <div className={styles.grid}>
      {metrics.map(metric => {
        const chartData = metric.quarters.map(q => ({
          period: q.period,
          value: q.value,
        }));
        const color = getTrendColor(metric);
        const format = metric.format;

        return (
          <div key={metric.label} className={styles.card}>
            <h4 className={styles.label}>{metric.label}</h4>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(value: number | string | undefined) => [formatMetricValue(value !== undefined ? Number(value) : null, format), metric.label]}
                  contentStyle={{ fontSize: '0.8rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 600, color: '#334155' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ fill: color, r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

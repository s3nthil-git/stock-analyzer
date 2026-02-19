import type { QuarterMetric, QuarterValue } from '../../types/quarterly';
import { formatMetricValue } from '../../utils/formatters';
import styles from './TrendsTable.module.css';

interface TrendsTableProps {
  metrics: QuarterMetric[];
}

function getArrow(quarter: QuarterValue, lowerIsBetter: boolean): { symbol: string; className: string } {
  if (quarter.direction === null) {
    return { symbol: '', className: '' };
  }
  if (quarter.direction === 'flat') {
    return { symbol: '\u2014', className: styles.flat };
  }

  const isGood = lowerIsBetter
    ? quarter.direction === 'down'
    : quarter.direction === 'up';

  return {
    symbol: quarter.direction === 'up' ? '\u25B2' : '\u25BC',
    className: isGood ? styles.good : styles.bad,
  };
}

export function TrendsTable({ metrics }: TrendsTableProps) {
  if (metrics.length === 0) return null;

  const quarterLabels = metrics[0].quarters.map(q => q.period);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.metricHeader}>Metric</th>
            {quarterLabels.map(label => (
              <th key={label} className={styles.quarterHeader}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric.label}>
              <td className={styles.metricLabel}>{metric.label}</td>
              {metric.quarters.map((quarter, i) => {
                const formatted = formatMetricValue(quarter.value, metric.format);
                const arrow = getArrow(quarter, metric.lowerIsBetter);
                return (
                  <td key={i} className={styles.cell}>
                    <span className={styles.value}>{formatted}</span>
                    {arrow.symbol && (
                      <span className={`${styles.change} ${arrow.className}`}>
                        {arrow.symbol}
                        {quarter.changePercent !== null && (
                          <span className={styles.percent}>
                            {Math.abs(quarter.changePercent).toFixed(1)}%
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

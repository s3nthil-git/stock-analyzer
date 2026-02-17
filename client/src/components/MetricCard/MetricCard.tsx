import type { MetricValue } from '../../types/stock';
import { formatMetricValue } from '../../utils/formatters';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  metric: MetricValue;
}

export function MetricCard({ metric }: MetricCardProps) {
  const formatted = formatMetricValue(metric.value, metric.format);
  const isNA = formatted === 'N/A';

  return (
    <div className={styles.card}>
      <span className={styles.label}>{metric.label}</span>
      <span className={`${styles.value} ${isNA ? styles.na : ''}`}>{formatted}</span>
    </div>
  );
}

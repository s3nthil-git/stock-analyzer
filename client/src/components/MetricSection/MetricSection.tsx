import type { MetricCategory } from '../../types/stock';
import { MetricCard } from '../MetricCard/MetricCard';
import styles from './MetricSection.module.css';

interface MetricSectionProps {
  category: MetricCategory;
}

export function MetricSection({ category }: MetricSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{category.title}</h3>
      <div className={styles.grid}>
        {category.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}

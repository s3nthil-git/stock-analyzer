import type { StockData } from '../../types/stock';
import { CompanyProfile } from '../CompanyProfile/CompanyProfile';
import { MetricSection } from '../MetricSection/MetricSection';
import styles from './Dashboard.module.css';

interface DashboardProps {
  data: StockData;
}

export function Dashboard({ data }: DashboardProps) {
  const timestamp = new Date(data.dataAsOf).toLocaleString();

  return (
    <div className={styles.container}>
      <div className={styles.meta}>
        <span className={styles.timestamp}>Data as of {timestamp}</span>
        {data.cached && <span className={styles.cached}>Cached</span>}
      </div>
      <CompanyProfile profile={data.profile} />
      <div className={styles.sections}>
        {data.categories.map((category) => (
          <MetricSection key={category.title} category={category} />
        ))}
      </div>
    </div>
  );
}

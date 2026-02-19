import { useState } from 'react';
import type { QuarterlyData } from '../../types/quarterly';
import { TrendsTable } from './TrendsTable';
import { TrendsChart } from './TrendsChart';
import styles from './TrendsSection.module.css';

interface TrendsSectionProps {
  data: QuarterlyData | null;
}

type ViewMode = 'table' | 'chart';

export function TrendsSection({ data }: TrendsSectionProps) {
  const [view, setView] = useState<ViewMode>('table');

  if (!data || data.metrics.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.heading}>Quarterly Trends</h2>
        <p className={styles.empty}>Quarterly data not available</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Quarterly Trends</h2>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${view === 'table' ? styles.active : ''}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
          <button
            className={`${styles.toggleBtn} ${view === 'chart' ? styles.active : ''}`}
            onClick={() => setView('chart')}
          >
            Chart
          </button>
        </div>
      </div>
      {view === 'table' ? <TrendsTable metrics={data.metrics} /> : <TrendsChart metrics={data.metrics} />}
    </div>
  );
}

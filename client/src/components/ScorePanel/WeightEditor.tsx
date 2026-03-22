import type { MetricKey, WeightConfig } from '../../types/stock';
import styles from './WeightEditor.module.css';

const METRIC_DISPLAY_LABELS: Record<MetricKey, string> = {
  revenueGrowth:   'Rev Growth',
  epsGrowth:       'EPS Growth',
  roe:             'ROE',
  operatingMargin: 'Op Margin',
  peRatio:         'P/E Ratio',
  pegRatio:        'PEG Ratio',
  debtToEquity:    'Debt/Equity',
  grossMargin:     'Gross Margin',
  netMargin:       'Net Margin',
  currentRatio:    'Current Ratio',
};

const METRIC_ORDER: MetricKey[] = [
  'revenueGrowth', 'epsGrowth', 'roe', 'operatingMargin',
  'peRatio', 'pegRatio', 'debtToEquity', 'grossMargin', 'netMargin', 'currentRatio',
];

interface WeightEditorProps {
  weights: WeightConfig;
  lastNamedPreset: 'growth' | 'value';
  onSetWeight: (key: MetricKey, value: number) => void;
  onReset: () => void;
}

export function WeightEditor({ weights, lastNamedPreset, onSetWeight, onReset }: WeightEditorProps) {
  return (
    <div className={styles.editor}>
      <div className={styles.hint}>Drag to rebalance · Total: 100% ✓</div>
      {METRIC_ORDER.map(key => (
        <div key={key} className={`${styles.row} ${weights[key] === 0 ? styles.zero : ''}`}>
          <span className={styles.label}>{METRIC_DISPLAY_LABELS[key]}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[key]}
            onChange={e => onSetWeight(key, Number(e.target.value))}
            className={styles.slider}
            aria-label={`${METRIC_DISPLAY_LABELS[key]} weight`}
          />
          <span className={styles.value}>{weights[key]}%</span>
        </div>
      ))}
      <button className={styles.resetBtn} onClick={onReset}>
        Reset to {lastNamedPreset === 'growth' ? 'Growth' : 'Value'} preset
      </button>
    </div>
  );
}

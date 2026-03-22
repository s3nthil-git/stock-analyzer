import { useMemo, useState } from 'react';
import type { StockData, ScoringOutput } from '../../types/stock';
import { scoreStock } from '../../utils/scoringEngine';
import { useWeights } from '../../hooks/useWeights';
import { WeightEditor } from './WeightEditor';
import styles from './ScorePanel.module.css';

const REC_COLORS: Record<string, string> = {
  'Strong Buy':  '#4ade80',
  'Buy':         '#86efac',
  'Hold':        '#facc15',
  'Sell':        '#fb923c',
  'Strong Sell': '#f87171',
};

function barColor(score: number): string {
  if (score >= 65) return '#4ade80';
  if (score >= 45) return '#facc15';
  return '#f87171';
}

interface ScorePanelProps {
  stockData: StockData;
}

export function ScorePanel({ stockData }: ScorePanelProps) {
  const { weights, preset, lastNamedPreset, setWeight, applyPreset, resetToPreset } = useWeights();
  const [showWeights, setShowWeights] = useState(false);

  const result: ScoringOutput = useMemo(
    () => scoreStock(stockData.categories, stockData.profile.sector, weights),
    [stockData, weights],
  );

  if (!result) {
    return (
      <div className={styles.panel}>
        <div className={styles.noData}>Insufficient data to score this stock.</div>
      </div>
    );
  }

  const recColor = REC_COLORS[result.recommendation] ?? '#aaa';

  return (
    <div className={styles.panel}>
      {/* Preset toggle */}
      <div className={styles.presets}>
        {(['growth', 'value'] as const).map(p => (
          <button
            key={p}
            className={`${styles.presetBtn} ${(preset === p || (preset === 'custom' && lastNamedPreset === p)) ? styles.active : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p === 'growth' ? 'Growth' : 'Value'}
          </button>
        ))}
      </div>

      {/* Score */}
      <div className={styles.scoreDisplay}>
        <div className={styles.scoreLabel}>Stock Score</div>
        <div className={styles.scoreNumber} style={{ color: recColor }} data-testid="score-number">
          {result.score}
        </div>
        <div className={styles.scoreOutOf}>out of 100</div>
        <div className={styles.badge} style={{ color: recColor, borderColor: recColor }} data-testid="recommendation">
          {result.recommendation}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${result.score}%` }} />
      </div>
      <div className={styles.progressLabels}>
        <span>Sell</span><span>Hold</span><span>Buy</span>
      </div>

      {/* Category breakdown */}
      <div className={styles.breakdown}>
        <div className={styles.breakdownLabel}>Breakdown</div>
        {result.breakdown.map(cat => (
          <div key={cat.title} className={styles.breakdownRow}>
            <span className={styles.catName}>{cat.title}</span>
            {cat.score !== null ? (
              <>
                <span className={styles.catScore} style={{ color: barColor(cat.score) }}>
                  {cat.score}
                </span>
                <div className={styles.catBar}>
                  <div
                    className={styles.catBarFill}
                    style={{ width: `${cat.score}%`, backgroundColor: barColor(cat.score) }}
                  />
                </div>
              </>
            ) : (
              <span className={styles.catScore}>—</span>
            )}
          </div>
        ))}
      </div>

      {/* Weight editor toggle */}
      <button className={styles.adjustBtn} onClick={() => setShowWeights(v => !v)}>
        ⚙ {showWeights ? 'Hide weights' : 'Adjust weights'}
      </button>

      {showWeights && (
        <WeightEditor
          weights={weights}
          lastNamedPreset={lastNamedPreset}
          onSetWeight={setWeight}
          onReset={resetToPreset}
        />
      )}
    </div>
  );
}

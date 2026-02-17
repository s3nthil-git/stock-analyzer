import { useState, type FormEvent } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (ticker: string) => void;
  loading: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = ticker.trim().toUpperCase();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="Enter stock ticker (e.g., AAPL)"
        disabled={loading}
        maxLength={5}
      />
      <button className={styles.button} type="submit" disabled={loading || !ticker.trim()}>
        {loading ? 'Loading...' : 'Look Up'}
      </button>
    </form>
  );
}

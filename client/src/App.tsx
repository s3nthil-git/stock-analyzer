import { SearchBar } from './components/SearchBar/SearchBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ErrorMessage } from './components/ErrorMessage/ErrorMessage';
import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';
import { useStockData } from './hooks/useStockData';
import styles from './App.module.css';

function App() {
  const { data, quarterlyData, loading, error, lookup } = useStockData();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Stock Analyzer</h1>
        <p className={styles.subtitle}>Look up any stock and see its fundamentals at a glance</p>
      </header>
      <main className={styles.main}>
        <SearchBar onSearch={lookup} loading={loading} />
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        {data && <Dashboard data={data} quarterlyData={quarterlyData} />}
      </main>
    </div>
  );
}

export default App;

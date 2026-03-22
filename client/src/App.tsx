import { SearchBar } from './components/SearchBar/SearchBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ScorePanel } from './components/ScorePanel/ScorePanel';
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
        {data && (
          <div className={styles.dashboardLayout}>
            <div className={styles.mainContent}>
              <Dashboard data={data} quarterlyData={quarterlyData} />
            </div>
            <div className={styles.scoreSidebar}>
              <ScorePanel stockData={data} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

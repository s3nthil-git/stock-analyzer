import type { CompanyProfile as CompanyProfileType } from '../../types/stock';
import styles from './CompanyProfile.module.css';

interface CompanyProfileProps {
  profile: CompanyProfileType;
}

export function CompanyProfile({ profile }: CompanyProfileProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.name}>{profile.name}</h2>
        <span className={styles.ticker}>{profile.ticker}</span>
        {profile.price !== null && (
          <span className={styles.price}>${profile.price.toFixed(2)}</span>
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.tag}>{profile.sector}</span>
        <span className={styles.tag}>{profile.industry}</span>
      </div>
      {profile.description && (
        <p className={styles.description}>{profile.description}</p>
      )}
    </div>
  );
}

import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className={styles.container}>
      <p className={styles.message}>{message}</p>
      <p className={styles.hint}>Check the ticker symbol and try again.</p>
    </div>
  );
}

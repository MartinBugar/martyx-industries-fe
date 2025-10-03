import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className="main-content">
      <div className="container">
        <div className={styles['loading-container']}>
          <div className={styles.spinner} />
          <p className={styles['loading-text']}>Loading...</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Singletx.module.css'

const PreparingTxbuilder = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/txbuilder');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.body}>
        <div className={styles.form}>
            <h1 className={styles.loading}>Prepping Tx Builder...</h1>
        </div>
    </div>
  );
};

export default PreparingTxbuilder;

import styles from '../../styles/Singletx.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { checkTxStatus } from '../../utils/checkTxStatus';

function Done() {
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [txStatus, setTxStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (connected) {
      checkStatus();
    }
  }, [connected]);

  async function checkStatus() {
    const { txId } = router.query;
    const usedAddresses = await wallet.getUsedAddresses();
    let transactionStatus = false;

    while (!transactionStatus) {
      transactionStatus = await checkTxStatus(usedAddresses[0], txId);
      if (!transactionStatus) {
        await new Promise(resolve => setTimeout(resolve, 20000));
      } else {
        break;
      }
    }

    setTxStatus(transactionStatus);
    setTimeout(() => {
      router.push(`/txbuilder`);
    }, 5000);
  }



  return (
    <div>
        {!connected && !txStatus && (
        <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>Connect Wallet...</div>
            </div>
        </div>
        )}
        {connected && !txStatus && (
        <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>TX Pending...</div>
            </div>
        </div>
        )}
        {connected && txStatus && (
          <div className={styles.main}>
            <h1 className={styles.heading}>Transaction Complete</h1>
          </div>
        )}
    </div>
  );
}

export default Done;

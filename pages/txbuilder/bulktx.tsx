import React, { useState } from 'react';
import styles from '../../styles/Bulktx.module.css';
import TransactionForm from '../../components/ContributionForm';

function Bulktx() {
  const [contributionsJSON, setContributionsJSON] = useState('');

  const handleContributionsUpdate = (contributions) => {
    setContributionsJSON(JSON.stringify(contributions, null, 2));
  };

  return (
    <>
    <h1>Transaction Builder</h1>
    <div className={styles.main}>
      <div>
        <TransactionForm onContributionsUpdate={handleContributionsUpdate} />
      </div>
      <div>
        <pre>{contributionsJSON}</pre>
      </div>
    </div> 
    </>
  );
}

export default Bulktx;

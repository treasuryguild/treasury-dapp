import React, { useState } from 'react';
import styles from '../../styles/Bulktx.module.css';
import TransactionForm from '../../components/ContributionForm';
import { Contribution } from '../../components/ContributionForm';
import { ContributionFormProps } from '../../components/ContributionForm';

function Bulktx() {
  const [contributionsJSON, setContributionsJSON] = useState('');

  const handleContributionsUpdate = (contributions: Contribution[]) => {
    setContributionsJSON(JSON.stringify(contributions, null, 2));
  };

  const myVariable = "Community Communication"; // define your variable

  const contributionFormProps: ContributionFormProps = { // create an object with the props you want to pass
    onContributionsUpdate: handleContributionsUpdate,
    myVariable: myVariable,
  }

  return (
    <>
    <h1>Transaction Builder</h1>
    <div className={styles.main}>
      <div>
      <TransactionForm {...contributionFormProps} />
      </div>
      <div className={styles.preContainer}>
        <pre>{contributionsJSON}</pre>
      </div>
    </div> 
    </>
  );
}

export default Bulktx;

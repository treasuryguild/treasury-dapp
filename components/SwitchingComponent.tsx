import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';

const SwitchingComponent = (props) => {
  const { executeTransaction, walletTokens, tokenRates, contributionBuilderProps } = props;

  // Create state to track whether the button is on or off
  const [isOn, setIsOn] = useState(true);

  // Function to toggle the button state
  const toggleButton = () => {
    setIsOn(!isOn);
  };

  return (
    <>
      <button onClick={toggleButton}>{isOn ? 'Switch to Off' : 'Switch to On'}</button>
      {isOn ? (
        <TransactionBuilder
          executeTransaction={executeTransaction}
          walletTokens={walletTokens}
          tokenRates={tokenRates}
        />
      ) : (
        <ContributionBuilder {...contributionBuilderProps} />
      )}
    </>
  );
};

export default SwitchingComponent;

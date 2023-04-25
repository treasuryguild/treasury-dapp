import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';

interface SwitchingComponentProps {
    executeTransaction: (assetsPerAddress: any, adaPerAddress: any, metaData: any) => Promise<string>;
    walletTokens: Array<any>; // Replace 'any' with the specific type if possible
    tokenRates: Array<any>; // Replace 'any' with the specific type if possible
    contributionBuilderProps: any; // Replace 'any' with the specific type if possible
    myVariable: any;
    onClick: () => void;
  }

const SwitchingComponent = (props: SwitchingComponentProps) => {
  const { executeTransaction, walletTokens, tokenRates, contributionBuilderProps, myVariable } = props;

  // Create state to track whether the button is on or off
  const [isOn, setIsOn] = useState(true);

  // Function to toggle the button state
  const toggleButton = () => {
    setIsOn(!isOn);
    props.onClick();
  };

  return (
    <>
      <button onClick={toggleButton}>{isOn ? 'Switch to Manual' : 'Switch to Dework'}</button>
      {isOn ? (
        <TransactionBuilder
          executeTransaction={executeTransaction}
          walletTokens={walletTokens}
          tokenRates={tokenRates}
          myVariable={myVariable}
        />
      ) : (
        <ContributionBuilder {...contributionBuilderProps} />
      )}
    </>
  );
};

export default SwitchingComponent;

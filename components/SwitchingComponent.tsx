import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';

interface SwitchingComponentProps {
    contributionBuilderProps: any; 
    transactionBuilderProps: any;
    onClick: () => void;
}

const SwitchingComponent = (props: SwitchingComponentProps) => {
  const { transactionBuilderProps, contributionBuilderProps } = props;

  // Create state to track whether the button is on or off
  const [isOn, setIsOn] = useState(true);

  // Function to toggle the button state
  const toggleButton = () => {
    setIsOn(!isOn);
    props.onClick();
    console.log(contributionBuilderProps.myVariable.group, transactionBuilderProps.myVariable.group);
  };

  return (
    <>
      {transactionBuilderProps.myVariable.group !== undefined && (
        <button onClick={toggleButton}>{isOn ? 'Switch to Manual' : 'Switch to Dework'}</button>
      )}
      {isOn ? (
        <TransactionBuilder {...transactionBuilderProps}/>
      ) : (
        <ContributionBuilder {...contributionBuilderProps} />
      )}
    </>
  );
};

export default SwitchingComponent;

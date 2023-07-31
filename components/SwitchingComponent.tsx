import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';
import { useMyVariable } from '../context/MyVariableContext';

interface SwitchingComponentProps {
    contributionBuilderProps: any; 
    transactionBuilderProps: any;
    onClick: () => void;
}

const SwitchingComponent = (props: SwitchingComponentProps) => {
  const { transactionBuilderProps, contributionBuilderProps } = props;

  // Create state to track whether the button is on or off
  const [isOn, setIsOn] = useState(true);
  const { myVariable, setMyVariable } = useMyVariable();

  // Function to toggle the button state
  const toggleButton = () => {
    setIsOn(!isOn);
    props.onClick();
    console.log(myVariable.group);
  };

  return (
    <>
      {myVariable.group !== undefined && (
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

import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';
import JsonGenTransactionBuilder from './JsonGenTransactionBuilder';
import { useMyVariable } from '../context/MyVariableContext';

interface SwitchingComponentProps {
    contributionBuilderProps: any; 
    transactionBuilderProps: any;
    jsonGenTransactionBuilderProps: any;
    onClick: (activeBuilder: BuilderType) => void;
}

type BuilderType = 'dework' | 'manual' | 'JsonGen';

const SwitchingComponent = (props: SwitchingComponentProps) => {
  const { transactionBuilderProps, contributionBuilderProps, jsonGenTransactionBuilderProps } = props;

  // Create state to track which builder is currently active
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>('dework');
  const { myVariable, setMyVariable } = useMyVariable();

  // Function to switch between builders
  const switchBuilder = (builderType: BuilderType) => {
    setActiveBuilder(builderType);
    props.onClick(builderType);
  };

  return (
    <>
      {myVariable.group !== undefined && (
        <div>
          <button onClick={() => switchBuilder('dework')}>Dework</button>
          <button onClick={() => switchBuilder('manual')}>Manual</button>
          <button onClick={() => switchBuilder('JsonGen')}>JsonGen</button>
        </div>
      )}
      {activeBuilder === 'dework' && (
        <TransactionBuilder {...transactionBuilderProps}/>
      )}
      {activeBuilder === 'manual' && (
        <ContributionBuilder {...contributionBuilderProps} />
      )}
      {activeBuilder === 'JsonGen' && (
        <JsonGenTransactionBuilder {...jsonGenTransactionBuilderProps} />
      )}
    </>
  );
};

export default SwitchingComponent;
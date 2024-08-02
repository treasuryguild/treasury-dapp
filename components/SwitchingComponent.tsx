import React, { useState } from 'react';
import TransactionBuilder from './TransactionBuilder';
import ContributionBuilder from './ContributionBuilder';
import JsonGenTransactionBuilder from './JsonGenTransactionBuilder';
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/SwitchingComponent.module.css';

interface SwitchingComponentProps {
    contributionBuilderProps: any; 
    transactionBuilderProps: any;
    jsonGenTransactionBuilderProps: any;
    onClick: (activeBuilder: BuilderType) => void;
}

type BuilderType = 'dework' | 'manual' | 'JsonGen';

const SwitchingComponent = (props: SwitchingComponentProps) => {
  const { transactionBuilderProps, contributionBuilderProps, jsonGenTransactionBuilderProps } = props;
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>('dework');
  const { myVariable, setMyVariable } = useMyVariable();

  const switchBuilder = (builderType: BuilderType) => {
    setActiveBuilder(builderType);
    props.onClick(builderType);
  };

  return (
    <div className={styles.container}>
      {myVariable.group !== undefined && (
        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.button} ${activeBuilder === 'dework' ? styles.active : ''}`} 
            onClick={() => switchBuilder('dework')}
          >
            Dework
          </button>
          <button 
            className={`${styles.button} ${activeBuilder === 'manual' ? styles.active : ''}`} 
            onClick={() => switchBuilder('manual')}
          >
            Manual
          </button>
          <button 
            className={`${styles.button} ${activeBuilder === 'JsonGen' ? styles.active : ''}`} 
            onClick={() => switchBuilder('JsonGen')}
          >
            JsonGen
          </button>
        </div>
      )}
      <div className={styles.builderContainer}>
        {activeBuilder === 'dework' && (
          <TransactionBuilder {...transactionBuilderProps}/>
        )}
        {activeBuilder === 'manual' && (
          <ContributionBuilder {...contributionBuilderProps} />
        )}
        {activeBuilder === 'JsonGen' && (
          <JsonGenTransactionBuilder {...jsonGenTransactionBuilderProps} />
        )}
      </div>
    </div>
  );
};

export default SwitchingComponent;
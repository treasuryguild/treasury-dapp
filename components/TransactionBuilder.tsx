import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Singletx.module.css'
//import { updateTxDatabase } from '../utils/updateTxDatabase'

export type TransactionBuilderProps = {
  executeTransaction: (
    assetsPerAddress: any,
    adaPerAddress: any,
    metaData: any
  ) => Promise<string>;
  walletTokens: any;
  tokenRates: any;
  myVariable: any;
}

const TransactionBuilder: React.FC<TransactionBuilderProps> = ({
  executeTransaction,
  walletTokens,
  tokenRates,
  myVariable,
}) => {
  const router = useRouter();

  async function getValues(deworkJson: any) {
    let addresses: any[] = [];
    let sendAssets: any[] = [];
    let sendAda: any[] = [];
    let assetsPerAddress: any;
    let adaPerAddress: any;
    let metaData: any;
    assetsPerAddress = {}
    adaPerAddress = {}
    metaData = {}
      const element = document.getElementById('deworkJson') as HTMLInputElement | null;
      deworkJson = JSON.parse(element?.value ?? "{}");
      metaData = deworkJson.metadata['674']
      for (let i in deworkJson.outputs) {
        sendAssets = []
        sendAda = []
        addresses.push(i)
        for (let j in deworkJson.outputs[i]) {
          for (let k in walletTokens) {
            if ((walletTokens[k].unit).startsWith(deworkJson.outputs[i][j].policyId)) {     
              sendAssets.push(JSON.parse(`{"unit":"${walletTokens[k].unit}","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            } else if ((deworkJson.outputs[i][j].policyId).toUpperCase() == "ADA" && (walletTokens[k].name).toUpperCase() == "ADA") { 
              sendAda.push(JSON.parse(`{"unit":"ADA","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            }
          }
        }
        assetsPerAddress[i] = sendAssets
        adaPerAddress[i] = sendAda
      }
    let thash = await executeTransaction(assetsPerAddress, adaPerAddress, metaData)
  }
 
  return (
    <div>
      <div className={styles.formitem}>
        <label className={styles.custom}>
          <textarea
            id="deworkJson"
            name="deworkJson"
            autoComplete="off"
            required
          />
          <span className={styles.tag}>Paste Json in here</span>
        </label>
      </div>
      <div className={styles.submit}>
      {Object.keys(tokenRates).length !== 0 && (
        <button
          className={styles.submitbut}
          type="button"
          onClick={() => {
            const element = document.getElementById(
              'deworkJson'
            ) as HTMLInputElement | null;
            const deworkJson = JSON.parse(element?.value ?? '{}');
            getValues(deworkJson);
          }}
        >
          Build
        </button>)}
      </div>
    </div>
  );
};

export default TransactionBuilder;

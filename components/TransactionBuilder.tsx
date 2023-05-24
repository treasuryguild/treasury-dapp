import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Singletx.module.css'
import { updateTxDatabase } from '../utils/updateTxDatabase'
import { sendDiscordMessage } from '../utils/sendDiscordMessage'

interface TransactionBuilderProps {
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
  myVariable
}) => {
  const router = useRouter();

  async function getValues(deworkJson: any) {
    let customFilePath = '';
    let customFileContent = '';
    let addresses: any[] = [];
    let sendAssets: any[] = [];
    let sendAda: any[] = [];
    let assetsPerAddress: any;
    let adaPerAddress: any;
    let metaData: any;
    assetsPerAddress = {}
    adaPerAddress = {}
    metaData = {}
    //await axios.get('https://raw.githubusercontent.com/treasuryguild/treasury-system-v4/main/data/exampleMetaData.json').then(response => {
      //const deworkJson = response.data
      const element = document.getElementById('deworkJson') as HTMLInputElement | null;
      deworkJson = JSON.parse(element?.value ?? "{}");
      console.log('Building', deworkJson);
      metaData = deworkJson.metadata['674']
      console.log('Building',deworkJson.outputs)

      for (let i in deworkJson.outputs) {
        sendAssets = []
        sendAda = []
        addresses.push(i)
        console.log("deworkJson.outputs[i]",deworkJson.outputs[i][0],i)
        for (let j in deworkJson.outputs[i]) {
          for (let k in walletTokens) {
            if ((walletTokens[k].unit).startsWith(deworkJson.outputs[i][j].policyId)) {
              console.log("Final result",deworkJson.outputs[i][j].quantity,walletTokens[j].name)
              sendAssets.push(JSON.parse(`{"unit":"${walletTokens[k].unit}","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            } else if ((deworkJson.outputs[i][j].policyId).toUpperCase() == "ADA" && (walletTokens[k].name).toUpperCase() == "ADA") { //Made it like this to show that we're looking for ADA amount
              console.log("Final result",deworkJson.outputs[i][j].quantity,walletTokens[j].name)
              sendAda.push(JSON.parse(`{"unit":"ADA","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            }
          }
        }
        assetsPerAddress[i] = sendAssets
        adaPerAddress[i] = sendAda
      }
    //})
    console.log("assetsPerAddress",assetsPerAddress, adaPerAddress, metaData, walletTokens)
    //await sendDiscordMessage(myVariable); // temp sendMessage for testing
    let thash = await executeTransaction(assetsPerAddress, adaPerAddress, metaData)
    //console.log("thash",thash)
    let newMetaData = metaData
    //newMetaData['txid'] = thash
    console.log("newMetaData",newMetaData)
    customFileContent = `${JSON.stringify(newMetaData, null, 2)}`;
    let pType = ''
    if (myVariable.project_type == 'Treasury Wallet') {
      pType = 'TreasuryWallet'
    }
    customFilePath = `Transactions/${(myVariable.group).replace(/\s/g, '-')}/${pType}/${(myVariable.project).replace(/\s/g, '-')}/bulkTransactions/TEst2.json`;
    await updateTxDatabase(myVariable, metaData, thash)
    //await commitFile(customFilePath, customFileContent)
    //await sendDiscordMessage(myVariable)
    setTimeout(function() {
      //router.push(`/transactions/${thash}`)
    }, 1000); // 3000 milliseconds = 3 seconds
  }

  async function commitFile(filePath: string, fileContent: string) {
    const commitMessage = 'Transaction';
  
    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, fileContent, commitMessage }),
      });
  
      if (!response.ok) {
        throw new Error('Error committing file');
      }
  
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error committing file to GitHub:', error);
    }
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
        </button>
      </div>
    </div>
  );
};

export default TransactionBuilder;

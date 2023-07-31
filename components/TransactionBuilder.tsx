import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Singletx.module.css'
import { useMyVariable } from '../context/MyVariableContext';
//import { updateTxDatabase } from '../utils/updateTxDatabase'

export type TransactionBuilderProps = {
  executeTransaction: (
    assetsPerAddress: any,
    adaPerAddress: any,
    metaData: any
  ) => Promise<string>;
  walletTokens: any;
  tokenRates: any;
}

const TransactionBuilder: React.FC<TransactionBuilderProps> = ({
  executeTransaction,
  walletTokens,
  tokenRates,
}) => {
  const router = useRouter();
  const { myVariable, setMyVariable } = useMyVariable();
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    setMonths(getLastSixMonths());
  }, []);

  const getLastSixMonths = () => {
    let months = [];
    for (let i = 0; i < 6; i++) {
      let d = new Date();
      d.setMonth(d.getMonth() - i + 1, 1); // Set the day to 1 to avoid end of month discrepancies
      d.setHours(0, 0, 0, 0); // Reset time portion to avoid timezone and daylight saving time issues
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  };   

  const handleBudgetMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMyVariable(prevState => ({...prevState, budget_month: event.target.value}));
  };

  const handleSendMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMyVariable(prevState => ({...prevState, send_message: event.target.checked}));
  };

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
      <div>
        <label>Budget Month:</label>
        <select value={myVariable.budget_month} onChange={handleBudgetMonthChange}>
          {months.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Send Discord Message:</label>
        <input
          type="checkbox"
          checked={myVariable.send_message}
          onChange={handleSendMessageChange}
        />
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

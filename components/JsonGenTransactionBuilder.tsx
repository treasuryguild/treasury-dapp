import React, { useState, useEffect } from 'react';
import { useMyVariable } from '../context/MyVariableContext';
import supabase from "../lib/supabaseClient";
import styles from '../styles/JsonGen.module.css';

export type JsonGenTransactionBuilderProps = {
  executeTransaction: (
    assetsPerAddress: any,
    adaPerAddress: any,
    metaData: any
  ) => Promise<string>;
  walletTokens: any;
  tokenRates: any;
};

const JsonGenTransactionBuilder: React.FC<JsonGenTransactionBuilderProps> = ({
  executeTransaction,
  walletTokens,
  tokenRates,
}) => {
  const { myVariable, setMyVariable } = useMyVariable();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allTokens, setAllTokens] = useState<string[]>([]);
  const [tokenRegistryMap, setTokenRegistryMap] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    fetchTransactions();
    //console.log('Wallet changed:', myVariable);
  }, [myVariable.wallet]);

  const fetchTransactions = async () => {
    if (!myVariable.wallet) {
      console.log("Wallet not set, skipping fetch");
      return;
    }

    const { data, error } = await supabase
      .from('tx_json_generator_data')
      .select('*')
      .eq('reward_status', false)
      .eq('project_wallet', myVariable.wallet);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
      //console.log('Transactions fetched successfully:', data);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      const tokensSet: Set<string> = new Set<string>();
      const registryMap: { [key: string]: any } = {};
      const tokenAmountsTotal: { [key: string]: number } = {};
  
      transactions.forEach((tx) => {
        try {
          let data;
          if (typeof tx.processed_data === 'string') {
            data = JSON.parse(tx.processed_data);
          } else if (typeof tx.processed_data === 'object' && tx.processed_data !== null) {
            data = tx.processed_data;
          } else {
            throw new Error('Invalid processed_data format');
          }
  
          const outputs = data.outputs;
          console.log('outputs:', outputs);
          const tokenRegistry = tx.raw_data.tokenRegistry;
  
          // Build registryMap
          for (const key in tokenRegistry) {
            const tokenInfo = tokenRegistry[key];
            const tokenTicker = tokenInfo.tokenTicker;
  
            // Map token unique identifier to its registry info
            const tokenKey = `${tokenInfo.policyId}.${tokenInfo.assetName}`;
            registryMap[tokenKey] = tokenInfo;
          }
  
          // Collect and adjust token amounts
          for (const address in outputs) {
            const outputsArray = outputs[address];
            outputsArray.forEach((output: any) => {
              if (output.policyId.toUpperCase() !== '') {
                const tokenKey = `${output.policyId}.${output.assetName}`;
                const tokenInfo = registryMap[tokenKey];
                if (tokenInfo) {
                  const multiplier = parseInt(tokenInfo.multiplier);
                  const quantity = parseFloat(output.quantity) / Math.pow(10, multiplier);
                  const tokenTicker = tokenInfo.tokenTicker;
                  tokensSet.add(tokenTicker);
                  tokenAmountsTotal[tokenTicker] = (tokenAmountsTotal[tokenTicker] || 0) + quantity;
                }
              }
            });
          }
        } catch (error) {
          console.error('Error parsing processed_data:', error);
        }
      });
  
      // Filter tokens with amounts > 0
      const tokensWithAmounts = Array.from(tokensSet).filter(
        (tokenTicker) => tokenAmountsTotal[tokenTicker] > 0
      );
      setAllTokens(tokensWithAmounts);
      setTokenRegistryMap(registryMap);
    }
  }, [transactions]);  

  const updateRewardStatus = async (id: number, transactionHash: string) => {
    const { error } = await supabase
      .from('tx_json_generator_data')
      .update({ reward_status: true, transaction_id: transactionHash })
      .eq('id', id);

    if (error) {
      console.error('Error updating reward status:', error);
    } else {
      console.log('Reward status and transaction ID updated successfully');
      // Refresh the transactions list
      fetchTransactions();
    }
  };

  const handleBuildTransaction = async (id: number, processedData: any) => {
    setLoading(true);
    try {
      let data;
      if (typeof processedData === 'string') {
        data = JSON.parse(processedData);
      } else if (typeof processedData === 'object' && processedData !== null) {
        data = processedData;
      } else {
        throw new Error('Invalid processed_data format');
      }

      const { outputs, metadata } = data;
      
      let assetsPerAddress: any = {};
      let adaPerAddress: any = {};

      for (const address in outputs) {
        assetsPerAddress[address] = [];
        adaPerAddress[address] = [];

        for (const output of outputs[address]) {
          if (output.policyId.toUpperCase() === "ADA") {
            adaPerAddress[address].push({
              unit: "lovelace",
              quantity: output.quantity
            });
          } else {
            const token = walletTokens.find((t: any) => t.unit.startsWith(output.policyId));
            if (token) {
              assetsPerAddress[address].push({
                unit: token.unit,
                quantity: output.quantity
              });
            }
          }
        }
      }

      const txHash = await executeTransaction(assetsPerAddress, adaPerAddress, metadata['674']);
      console.log('Transaction successful:', txHash);
      
      // Update the reward status and transaction_id in the database
      await updateRewardStatus(id, txHash);
      
      alert('Transaction built successfully!');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Failed to build transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Pending Transactions (Only shows transactions for this wallet)</h2>
      {transactions.length === 0 ? (
        <p className={styles.noTransactions}>No pending transactions for this wallet.</p>
      ) : Object.keys(tokenRates).length !== 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.centerAlign}>Created At</th>
              <th className={styles.centerAlign}>Recipients</th>
              {allTokens.map((token) => (
                <th key={token} className={styles.centerAlign}>{token}</th>
              ))}
              <th className={styles.centerAlign}>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              let numRecipients: any = 'N/A';
              let tokenAmounts: { [key: string]: number } = {}; // To store adjusted token amounts
              try {
                let data;
                if (typeof tx.processed_data === 'string') {
                  data = JSON.parse(tx.processed_data);
                } else if (typeof tx.processed_data === 'object' && tx.processed_data !== null) {
                  data = tx.processed_data;
                } else {
                  throw new Error('Invalid processed_data format');
                }
                const outputs = data.outputs;
                numRecipients = Object.keys(outputs).length;

                // Initialize tokenAmounts with zero
                allTokens.forEach((token) => {
                  tokenAmounts[token] = 0;
                });

                const tokenRegistry = tx.raw_data.tokenRegistry;

                // Create a mapping from policyId.assetName to tokenInfo
                const registryMap: { [key: string]: any } = {};
                for (const key in tokenRegistry) {
                  const tokenInfo = tokenRegistry[key];
                  const tokenKey = `${tokenInfo.policyId}.${tokenInfo.assetName}`;
                  registryMap[tokenKey] = tokenInfo;
                }

                // Collect and adjust token amounts
                for (const address in outputs) {
                  const outputsArray = outputs[address];
                  outputsArray.forEach((output: any) => {
                    if (output.policyId.toUpperCase() !== '') {
                      const tokenKey = `${output.policyId}.${output.assetName}`;
                      const tokenInfo = registryMap[tokenKey];
                      if (tokenInfo) {
                        const multiplier = parseInt(tokenInfo.multiplier);
                        const quantity = parseFloat(output.quantity) / Math.pow(10, multiplier);
                        const tokenTicker = tokenInfo.tokenTicker;
                        tokenAmounts[tokenTicker] = (tokenAmounts[tokenTicker] || 0) + quantity;
                      }
                    }
                  });
                }
              } catch (error) {
                console.error('Error parsing processed_data:', error);
              }

              return (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                  <td className={styles.centerAlign}>{numRecipients}</td>
                  {allTokens.map((token) => (
                    <td key={token}>{tokenAmounts[token] ? tokenAmounts[token].toFixed(2) : ''}</td>
                  ))}
                  <td>
                    <button
                      className={`${styles.button} ${loading ? styles.loading : ''}`}
                      onClick={() => handleBuildTransaction(tx.id, tx.processed_data)}
                      disabled={loading}
                    >
                      {loading ? 'Building...' : 'Build Transaction'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default JsonGenTransactionBuilder;

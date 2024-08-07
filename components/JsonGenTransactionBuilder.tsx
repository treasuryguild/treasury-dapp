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

  useEffect(() => {
    fetchTransactions();
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
    }
  };

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
      <h2 className={styles.title}>Pending Transactions</h2>
      {transactions.length === 0 ? (
        <p className={styles.noTransactions}>No pending transactions for this wallet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleString()}</td>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default JsonGenTransactionBuilder;
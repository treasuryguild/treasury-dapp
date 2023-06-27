import Link from 'next/link'
import axios from 'axios';
import { useEffect, useState } from 'react'
import { useWallet } from '@meshsdk/react';
import supabase from "../../lib/supabaseClient";
import { getProject } from '../../utils/getProject'

function TransactionsList() {

  const { connected, wallet } = useWallet();
  const [txs, setTxs] = useState([])
  const [txsNotRecorded, setTxsNotRecorded] = useState([])

  useEffect(() => {
    if (connected) {
      //getDandelion();;
      koiosFetch()
    }
  }, [connected]);

  async function getWalletInfo() {}

  async function koiosFetch() {
    const usedAddresses = await wallet.getUsedAddresses();
    const projectInfo = await getProject(usedAddresses[0]);
    const url = "https://api.koios.rest/api/v0/address_txs";
    const data = {
      _addresses: [
        usedAddresses[0]
      ]
    };
    
    await axios.post(url, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(async function (response) {
      setTxs(response.data.slice(0, 30))
      const notRecorded = await checkDatabase(projectInfo.project_id, response.data.slice(0, 30));
      setTxsNotRecorded(notRecorded);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  async function checkDatabase(project_id, newTxs) {
    const { data: existingTransactions, error: error1 } = await supabase
      .from("transactions")
      .select("transaction_id")
      .eq("project_id", project_id);
        
    if (error1) throw error1;

    const existingTransactionIds = existingTransactions.map(transaction => transaction.transaction_id);
    const txsNotRecorded = newTxs.filter(tx => !existingTransactionIds.includes(tx.tx_hash));
    
    return txsNotRecorded;
  }

  return (
    <>
      <h1>List of TX Ids not recorded in the database</h1>
      {txsNotRecorded.map(tx => {
        return (
          <div key={tx.tx_hash}>
            <Link href={`transactions/${tx.tx_hash}`}>
              <h2>
                {tx.tx_hash}
              </h2>
            </Link>
            <hr />
          </div>
        )
      })}
    </>
  )
}

export default TransactionsList

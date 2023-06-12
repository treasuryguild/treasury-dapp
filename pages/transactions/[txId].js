import { useRouter } from 'next/router'
import { useEffect, SetStateAction, useState } from 'react'
import { useWallet } from '@meshsdk/react';
import axios from 'axios'


function Txid() {
  const router = useRouter()
  const { txId } = router.query
  const { connected, wallet } = useWallet();

  useEffect(() => {
    if (connected) {
      console.log("pid",txId)
      checkTransactionType()
    }
  }, [connected]);

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  async function transactionType(usedAddresses, txData, assets) {
    const inputs = txData.inputs;
    const outputs = txData.outputs;
  
    let totalIncoming = 0;
    let incomingAssetList = [];
    let outgoingAddressesInfo = [];
    let incomingAddressesInfo = [];  // add this line to store information about incoming addresses
  
    // Determine if it's an outgoing transaction
    let isOutgoing = false;
    for (const input of inputs) {
      if (usedAddresses.includes(input.payment_addr.bech32)) {
        isOutgoing = true;
        break;
      }
    }
  
    if (isOutgoing) {
      // If it's an outgoing transaction, gather information about the addresses to which the funds are sent
      for (const output of outputs) {
        if (!usedAddresses.includes(output.payment_addr.bech32)) {
          const assetList = output.asset_list.map(outgoingAsset => {
            for (let asset of assets) {
              if (asset.fingerprint === outgoingAsset.fingerprint) {
                outgoingAsset.assetName = asset.assetName;
                outgoingAsset.unit = asset.unit;
                break;
              }
            }
            return outgoingAsset;
          });
  
          outgoingAddressesInfo.push({
            address: output.payment_addr.bech32,
            value: output.value,
            assetList: assetList,
          });
        }
      }
      console.log('Outgoing transactions info:', outgoingAddressesInfo);
      return 'Outgoing transaction';
    } else {
      // If it's an incoming transaction, calculate total incoming value, gather asset lists, and capture the sender's addresses
      for (const input of inputs) {
        if (!usedAddresses.includes(input.payment_addr.bech32)) {
          incomingAddressesInfo.push(input.payment_addr.bech32);
        }
      }
  
      for (const output of outputs) {
        if (usedAddresses.includes(output.payment_addr.bech32)) {
          totalIncoming += parseInt(output.value);
          const assetList = output.asset_list.map(incomingAsset => {
            for (let asset of assets) {
              if (asset.fingerprint === incomingAsset.fingerprint) {
                incomingAsset.assetName = asset.assetName;
                incomingAsset.unit = asset.unit;
                break;
              }
            }
            return incomingAsset;
          });
  
          incomingAssetList = [...incomingAssetList, ...assetList];
        }
      }
      console.log('Total incoming value:', totalIncoming);
      console.log('Incoming asset list:', incomingAssetList);
      console.log('Incoming addresses:', incomingAddressesInfo);  // add this line to log incoming addresses
      return 'Incoming transaction';
    }
  }
  
  
  async function checkTransactionType() {
    if (connected) {
      const usedAddresses = await wallet.getUsedAddresses();
      const assets = await wallet.getAssets();
      const txData = await koiosFetch();
      const type = await transactionType(usedAddresses, txData[0], assets);
      console.log(type, assets);
      console.log(txData[0]);
    }
  }
  async function koiosFetch() {
    let txData = []
    const url = "https://api.koios.rest/api/v0/tx_info";
    const data = {
      _tx_hashes: [
        txId
      ]
    };
    
    await axios.post(url, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(async function (response) {
      console.log(response.data);
      txData = response.data
    })
    .catch(function (error) {
      console.log(error);
    });
    return txData
  }

  return (
    <>
      <h2>
        Test
      </h2>
      <p>{txId}</p>
    </>
  )
}

export default Txid

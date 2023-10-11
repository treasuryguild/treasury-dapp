import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { Transaction, ForgeScript, resolvePaymentKeyHash, resolveSlotNo } from '@meshsdk/core';
import type { Asset } from '@meshsdk/core';
import styles from '../../styles/Minttokens.module.css';
import { useState, useEffect } from 'react';
import { getTxAmounts } from "../../utils/gettxamounts";

function BurnTokens() {
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [tokenUnit, setTokenUnit] = useState('');
  const [amount, setAmount] = useState('');

  async function getTokens() {
    const _assets = await wallet.getAssets();
    console.log(_assets)
  }

  useEffect(() => {
    if (connected) {
        getTokens();
    }
  }, [connected]);

  async function burn(event: any) {
    event.preventDefault();
    // prepare forgingScript
    const usedAddress = await wallet.getUsedAddresses();
    const address = usedAddress[0];
    const forgingScript = ForgeScript.withOneSignature(address);
    
    const tx = new Transaction({ initiator: wallet });
    
    // burn asset#1
    const asset1: Asset = {
      unit: tokenUnit,
      quantity: amount,
    };
    tx.burnAsset(forgingScript, asset1);
    
    const unsignedTx = await tx.build();
    const { txamounts, fee } = getTxAmounts(unsignedTx);
    console.log("txamounts, fee", txamounts, fee)
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    return txHash;
  }

  return (
    <>
      <div className={styles.body}>
        <form className={styles.form} onSubmit={burn}>
          <h1>Burn Tokens</h1>
          <label className={styles.input}>Enter unit string:</label>
          <input type="text" value={tokenUnit} onChange={(e) => setTokenUnit(e.target.value)} />
          <label className={styles.input}>Amount to burn:</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className={styles.submit} type="submit">Mint</button>
        </form>
      </div>
    </>
  )
}

export default BurnTokens;

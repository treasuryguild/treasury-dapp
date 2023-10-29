import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { Transaction, ForgeScript, resolvePaymentKeyHash, resolveSlotNo } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';
import type { NativeScript } from '@meshsdk/core';
import styles from '../../styles/Minttokens.module.css';
import { useState } from 'react';
import { getTxAmounts } from "../../utils/gettxamounts";

function MintFungibleTokens() {
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [decimals, setDecimals] = useState(0);
  const [website, setWebsite] = useState('');
  const [assetQuantity, setAssetQuantity] = useState('');
  const [image, setImage] = useState([]); 
  const [policy, setPolicy] = useState('closed');

  async function mintNative(event: any) {
    event.preventDefault();
    const usedAddress = await wallet.getUsedAddresses();
    const address = usedAddress[0];
    
    const keyHash = resolvePaymentKeyHash(address);
    let minutes = 1; // add 5 minutes
    let nowDateTime = new Date();
    let dateTimeAdd5Min = new Date(nowDateTime.getTime() + minutes*60000);
    const slot = resolveSlotNo('mainnet', dateTimeAdd5Min.getTime());
    const nativeScript: NativeScript = {
      type: 'all',
      scripts: [
        {
          type: 'before',
          slot: slot,
        },
        {
          type: 'sig',
          keyHash: keyHash,
        },
      ],
    };
    
    const forgingScript = policy === 'closed' ? 
    ForgeScript.fromNativeScript(nativeScript) : 
    ForgeScript.withOneSignature(address);

    //const forgingScript = ForgeScript.fromNativeScript(nativeScript);
    //const forgingScript2 = ForgeScript.withOneSignature(address);
    
    const tx = new Transaction({ initiator: wallet });
    
    // define asset#1 metadata
    const assetMetadata1: AssetMetadata = {
      "name": tokenName,
      "decimals": decimals,
      "ticker": ticker,
      "website": website,
      "image": image, 
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    };
    //Treasury Guild ipfs://bafkreiccmrypkhje4iakdqdmqxol5x7lwc365akayyba74n2tx5pahfxxm
    //automate ipfs://bafkreialfwbehx5kppkbhsmjdp2e75zcoczcvcolwn56uthxvom4vnyvsm
    //voting ipfs://bafkreigpzaox2zp4esvt5ng23aldzeqjrbmo6jtvljkaz7i4uglo4a7qee
    //Deepfund academy ipfs://bafkreig2pze4gdl3gmnvn6s6g5hjdx64nzcfnq2alkujtt7rnts2khjvd4
    const asset1: Mint = {
      assetName: tokenName,
      assetQuantity: assetQuantity,
      metadata: assetMetadata1,
      label: '721', 
      recipient: usedAddress[0],
    };
    tx.mintAsset(
      forgingScript,
      asset1,
    );
    
    tx.setTimeToExpire(slot);
    
    const unsignedTx = await tx.build();
    const { txamounts, fee } = getTxAmounts(unsignedTx);
    console.log("txamounts, fee", txamounts, fee)
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    return txHash;
  }

  const handleImageChange = (event: any) => {
    const value = event.target.value;
    setImage(value.match(/.{1,55}/g) || []); // break the string into chunks 
  }

  return (
    <>
      <div className={styles.body}>
        <form className={styles.form} onSubmit={mintNative}>
          <h1>Mint Fungible Tokens</h1>
          <label className={styles.input}>Policy:</label>
          <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
          <label className={styles.input}>Token Name:</label>
          <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
          <label className={styles.input}>Ticker:</label>
          <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} />
          <label className={styles.input}>Decimals:</label>
          <input type="number" value={decimals} onChange={(e) => setDecimals(parseInt(e.target.value))} />
          <label className={styles.input}>Website:</label>
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <label className={styles.input}>Asset Quantity:</label>
          <input type="text" value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} />
          <label className={styles.input}>Image URL:</label>
          <input type="text" value={image.join('')} onChange={handleImageChange} />
          <button className={styles.submit} type="submit">Mint</button>
        </form>
      </div>
    </>
  )
}

export default MintFungibleTokens;

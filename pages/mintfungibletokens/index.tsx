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
  const [tokenType, setTokenType] = useState('fungible');
  const [nftType, setNftType] = useState('single');

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
    const assetMetadata1: AssetMetadata = tokenType === 'fungible' ? {
      "name": tokenName,
      "decimals": decimals,
      "ticker": ticker,
      "website": website,
      "image": image, 
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    } : {
      "name": tokenName,
      "website": website,
      "image": image, 
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    };

    const assetMetadata2: AssetMetadata = {
      "name": tokenName,
      "website": website,
      "image": image, 
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    };

    //Treasury Guild ipfs://bafkreiccmrypkhje4iakdqdmqxol5x7lwc365akayyba74n2tx5pahfxxm
    //automate ipfs://bafkreialfwbehx5kppkbhsmjdp2e75zcoczcvcolwn56uthxvom4vnyvsm
    //voting ipfs://bafkreigpzaox2zp4esvt5ng23aldzeqjrbmo6jtvljkaz7i4uglo4a7qee
    //Deepfund academy ipfs://bafkreig2pze4gdl3gmnvn6s6g5hjdx64nzcfnq2alkujtt7rnts2khjvd4
    // add web3 url to this url https://bafybeialrcsrzwy2uhrjndwbz2deztcdmtaidthp7wevm6brmrjo37hbvq.ipfs.dweb.link/
    
    const asset1: Mint = tokenType === 'fungible' ? {
      assetName: tokenName,
      assetQuantity: assetQuantity,
      metadata: assetMetadata1,
      label: '721', 
      recipient: usedAddress[0],
    } : {
      assetName: tokenName,
      assetQuantity: '1',
      metadata: assetMetadata1,
      label: '721', 
      recipient: usedAddress[0],
    };

    const asset2: Mint = {
      assetName: tokenName,
      assetQuantity: '1',
      metadata: assetMetadata2,
      label: '721', 
      recipient: usedAddress[0],
    }

    if (nftType == 'single' || tokenType == 'fungible') {
      tx.mintAsset(
        forgingScript,
        asset1,
      );
    } else if (nftType == 'double' && tokenType == 'nft') {
      tx.mintAsset(
        forgingScript,
        asset1,
        asset2
      );
    } 
    
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
          <label className={styles.input}>Token Type:</label>
          <select value={tokenType} onChange={(e) => setTokenType(e.target.value)}>
            <option value="fungible">Fungible Token</option>
            <option value="nft">NFT</option>
          </select>
          {tokenType == 'nft' && (<>
            <label className={styles.input}>NFT Type:</label>
            <select value={nftType} onChange={(e) => setNftType(e.target.value)}>
              <option value="single">Single user NFT</option>
              <option value="double">1 user NFT and 1 reference NFT</option>
            </select>
          </>)}
          <label className={styles.input}>Token Name:</label>
          <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
          {tokenType == 'fungible' && (<>
            <label className={styles.input}>Ticker:</label>
            <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} />
          </>)}
          {tokenType == 'fungible' && (<>
            <label className={styles.input}>Decimals:</label>
            <input type="number" value={decimals} onChange={(e) => setDecimals(parseInt(e.target.value))} />
          </>)}
          <label className={styles.input}>Website:</label>
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          {tokenType == 'fungible' && (<>
            <label className={styles.input}>Asset Quantity:</label>
            <input type="text" value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} />
          </>)}
          <label className={styles.input}>Image URL:</label>
          <input type="text" value={image.join('')} onChange={handleImageChange} />
          <button className={styles.submit} type="submit">Mint</button>
        </form>
      </div>
    </>
  )
}

export default MintFungibleTokens;

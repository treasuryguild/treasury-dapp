import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';
import styles from '../../styles/Minttokens.module.css';
import { useState } from 'react';

function MintFungibleTokens() {
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [decimals, setDecimals] = useState(0);
  const [website, setWebsite] = useState('');

  async function mintTokens(event: any) {
    event.preventDefault(); // prevent the default form submission behaviour

    const usedAddress = await wallet.getUsedAddresses();
    const address = usedAddress[0];
    const forgingScript = ForgeScript.withOneSignature(address);

    const tx = new Transaction({ initiator: wallet });

    const assetMetadata1: AssetMetadata = {
      "name": tokenName,
      "decimals": decimals,
      "ticker": ticker,
      "website": website,
      "image": "ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua",
      "mediaType": "image/jpg",
      "description": `This Token is minted by ${tokenName} (https://meshjs.dev/).`
    };

    const asset1: Mint = {
      assetName: tokenName,
      assetQuantity: '500000000',
      metadata: assetMetadata1,
      label: '20',
      recipient: address,
    };

    tx.mintAsset(
      forgingScript,
      asset1,
    );

    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    
    return txHash;
  }

  return (
    <>
      <div>
        <h1>Mint Fungible Tokens</h1>
        <form onSubmit={mintTokens}>
          <label>
            Token Name:
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
          </label>
          <label>
            Ticker:
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </label>
          <label>
            Decimals:
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(parseInt(e.target.value))}
            />
          </label>
          <label>
            Website:
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <button type="submit">Mint</button>
        </form>
      </div>
    </>
  )
}

export default MintFungibleTokens;

import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { Transaction, ForgeScript, resolvePaymentKeyHash, resolveSlotNo } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';
import type { NativeScript } from '@meshsdk/core';
import styles from '../../styles/Minttokens.module.css';
import { useState, useEffect } from 'react';
import { getTxAmounts } from "../../utils/gettxamounts";
import crypto from 'crypto';
import { getProject } from '../../utils/getProject'

function MintFungibleTokens() {
  const router = useRouter();
  const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
  const [file, setFile] = useState<Blob | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState([]);
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
  const [contributionDetails, setContributionDetails] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [contributorWallet, setContributorWallet] = useState('');
  const [mintOption, setMintOption] = useState('existing'); 
  const [allowedTokens, setAllowedTokens] = useState<string[]>([]);

  useEffect(() => {
    const checkProjectPermissions = async () => {
      if (connected && wallet) {
        const addresses = await wallet.getUsedAddresses();
        const primaryAddress = addresses[0];
        let projectInfo: any;
        projectInfo = await getProject(primaryAddress);
        console.log(projectInfo, projectInfo.project);
        
        // Define your logic for which projects can mint which tokens
        const permissionsMap: { [key: string]: string[] } = {
          'Singularity Net Ambassador Wallet': ['MINS'],
          'Test Wallet': ['INF','MINS'],
          // Add more projects and their allowed tokens as needed
        };

        setAllowedTokens(permissionsMap[projectInfo.project] || []);
      }
    };

    checkProjectPermissions();
  }, [connected, wallet]);

  const renderExistingTokenButtons = () => {
    return (
      <>
        {allowedTokens.includes('MINS') && (
          <button className={styles.mint} type="button" onClick={mintMinuteTokens}>Mint Minute Tokens</button>
        )}
        {allowedTokens.includes('INF') && (
          <button className={styles.mint} type="button" onClick={mintINFTokens}>Mint INF Tokens</button>
        )}
        {/* Add more token buttons here as needed */}
      </>
    );
  };

  const generateHash = (input: any) => {
    return crypto.createHash('sha256').update(input).digest('hex');
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: any = event.target.value;
    setImageUrl(value.match(/.{1,55}/g) || []);
    setImage([]); // Clear the image when a URL is entered
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Check if file type is acceptable
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        alert('File type not allowed. Please select a JPEG or PNG image.');
        return;
      }
      // Check if file size is within limit
      if (file.size > MAX_FILE_SIZE) {
        alert(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        return;
      }
      setFile(file);
      setImageUrl([]);
      console.log(file)
    }
  };  

const uploadToIpfs = async () => {
  if (!file) {
    console.error('No file selected');
    return;
  }
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Response data:', data); // Add this line for debugging
    if (response.ok) {
      alert(data.url);
      handleImageChange(data.url);
      console.log(data)
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

  async function mintTokens(tokenData: any) {
   
    if (tokenData.imageUrl.length === 0 && tokenData.image.length === 0) {
      alert("Please upload an image before minting.");
      return; // Exit the function if no image is uploaded
    }

    let imageToUse = tokenData.imageUrl.length != 0 ? tokenData.imageUrl : tokenData.image;

    const usedAddress = await wallet.getUsedAddresses();
    //const changeAddress = await wallet.getChangeAddress();
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
    
    const forgingScript = tokenData.policy === 'closed' ? 
    ForgeScript.fromNativeScript(nativeScript) : 
    ForgeScript.withOneSignature(address);

    //const forgingScript = ForgeScript.fromNativeScript(nativeScript);
    //const forgingScript2 = ForgeScript.withOneSignature(address);
    
    const tx = new Transaction({ initiator: wallet });
    
    // define asset#1 metadata
    const assetMetadata1: AssetMetadata = tokenData.tokenType === 'fungible' ? {
      "name": tokenData.tokenName,
      "decimals": tokenData.decimals,
      "ticker": tokenData.ticker,
      "website": tokenData.website,
      "image": imageToUse,
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    } : nftType === 'single' ? {
      "name": `ContributorNFT.${tokenName}`,
      "website": website,
      "image": imageToUse,
      "projectTitle": projectTitle,
      "contributionDetails": contributionDetails,
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    } : {
      "name": `ContributorNFT.${tokenName}`,
      "website": website,
      "image": imageToUse,
      "projectTitle": projectTitle,
      "referenceHash": generateHash(contributionDetails),
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    };

    const assetMetadata2: AssetMetadata = {
      "name": `ReferenceNFT.${tokenName}`,
      "website": website,
      "image": imageToUse, 
      "projectTitle": projectTitle,
      "contributionDetails": contributionDetails,
      "mediaType": "image/jpg",
      "description": "This Token was minted using Mesh.js (https://meshjs.dev/)."
    };

    //If IPFS api ever stops working here are some urls
    //Treasury Guild ipfs://bafkreiccmrypkhje4iakdqdmqxol5x7lwc365akayyba74n2tx5pahfxxm
    //automate ipfs://bafkreialfwbehx5kppkbhsmjdp2e75zcoczcvcolwn56uthxvom4vnyvsm
    //voting ipfs://bafkreigpzaox2zp4esvt5ng23aldzeqjrbmo6jtvljkaz7i4uglo4a7qee
    //Deepfund academy ipfs://bafkreig2pze4gdl3gmnvn6s6g5hjdx64nzcfnq2alkujtt7rnts2khjvd4
    // add web3 url to this url https://bafybeialrcsrzwy2uhrjndwbz2deztcdmtaidthp7wevm6brmrjo37hbvq.ipfs.dweb.link/
    
    const asset1: Mint = tokenData.tokenType === 'fungible' ? {
      assetName: tokenData.tokenName,
      assetQuantity: tokenData.assetQuantity,
      metadata: assetMetadata1,
      label: '721', 
      recipient: usedAddress[0],
    } : {
      assetName: tokenName,
      assetQuantity: '1',
      metadata: assetMetadata1,
      label: '721', 
      recipient: contributorWallet,
    };

    const asset2: Mint = {
      assetName: `ReferenceNFT.${tokenName}`,
      assetQuantity: '1',
      metadata: assetMetadata2,
      label: '721', 
      recipient: usedAddress[0],
    }

    if (nftType == 'single' || tokenData.tokenType == 'fungible') {
      tx.mintAsset(
        forgingScript,
        asset1,
      );
    } else if (nftType == 'double' && tokenData.tokenType == 'nft') {
      tx.mintAsset(
        forgingScript,
        asset1
      ).mintAsset(
        forgingScript,
        asset2
      );
    } 
    
    tx.setTimeToExpire(slot);
    
    const unsignedTx = await tx.build();
    const { txamounts, fee } = getTxAmounts(unsignedTx);
    console.log("txamounts, fee", txamounts, fee)
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    alert("Tokens Minted")
    return txHash;
  }

  const mintNative = async () => {
    
    const tokenData = {
      tokenName: tokenName,
      tokenType: tokenType,
      policy: policy,
      ticker: ticker,
      decimals: decimals,
      website: website,
      assetQuantity: assetQuantity,
      image: image,
      imageUrl: imageUrl
    };
    await mintTokens(tokenData);
  };

  const mintMinuteTokens = async () => {
    // Set your predetermined values
    const preTokenData = {
      tokenName: "Minutes",
      tokenType: "fungible",
      policy: "open",
      ticker: "MINS",
      decimals: 0,
      website: "https://treasuryguild.io",
      assetQuantity: "1000000",
      image: image,
      imageUrl: "ipfs://QmSdLfKdaVGL4xgsi5oVMaYLFHx1mAVePvsE63Ncccc3RZ/0"
    };
    await mintTokens(preTokenData);
  };

  const mintINFTokens = async () => {
    // Set your predetermined values
    const preTokenData = {
      tokenName: "SingularityNET Ambassador Influance Token",
      tokenType: "fungible",
      policy: "open",
      ticker: "INF",
      decimals: 0,
      website: "https://treasuryguild.com",
      assetQuantity: "10000",
      image: image,
      imageUrl: "ipfs://QmbvVUVGxeCREbJ7i79n1ncN152bexBbfsofi2C4P2ZLLF/0"
    };
    await mintTokens(preTokenData);
  };

  const handleImageChange = (url: any) => {
    if (typeof url !== 'string') {
      console.error('Invalid URL format');
      return;
    }
    const chunkedUrl: any = url.match(/.{1,55}/g) || [];
    setImage(chunkedUrl);
    console.log(chunkedUrl);
  };
  

  /*const handleImageChange = (event: any) => {
    const value = event.target.value;
    setImage(value.match(/.{1,55}/g) || []); // break the string into chunks 
  }*/

  return (
    <>
      <div className={styles.body}>
        <form className={styles.form}>
          <h1>Mint Tokens</h1>
          <label className={styles.input}>Select Minting Option:</label>
          <select className={styles.selectmint} value={mintOption} onChange={(e) => setMintOption(e.target.value)}>
            <option value="new">Mint New Token</option>
            <option value="existing">Mint Existing Token</option>
          </select>

          {mintOption === 'new' && (
            <>
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
              {tokenType === 'nft' && (
                <>
                  <label className={styles.input}>NFT Type:</label>
                  <select value={nftType} onChange={(e) => setNftType(e.target.value)}>
                    <option value="single">Single user NFT</option>
                    <option value="double">1 user NFT and 1 reference NFT</option>
                  </select>
                  <label className={styles.input}>Project Title:</label>
                  <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                  <label className={styles.input}>Contribution Details:</label>
                  <input type="text" value={contributionDetails} onChange={(e) => setContributionDetails(e.target.value)} />
                  {nftType === "double" && (
                    <>
                      <label className={styles.input}>Contributor Wallet:</label>
                      <input type="text" value={contributorWallet} onChange={(e) => setContributorWallet(e.target.value)} />
                    </>
                  )}
                </>
              )}
              <label className={styles.input}>Token Name:</label>
              <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
              {tokenType === 'fungible' && (
                <>
                  <label className={styles.input}>Ticker:</label>
                  <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} />
                  <label className={styles.input}>Decimals:</label>
                  <input type="number" value={decimals} onChange={(e) => setDecimals(parseInt(e.target.value))} />
                </>
              )}
              <label className={styles.input}>Website:</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
              {tokenType === 'fungible' && (
                <>
                  <label className={styles.input}>Asset Quantity:</label>
                  <input type="text" value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} />
                </>
              )}
              {image.length === 0 && (
                <>
                  <label className={styles.input}>Image URL: (Enter url or upload picture below)</label>
                  <input type="text" value={imageUrl} onChange={handleImageUrlChange} disabled={image.length > 0} />
                </>
              )}
              {imageUrl.length === 0 && (
                <div className={styles.imageInput}>
                  <input type="file" onChange={handleFileChange} disabled={imageUrl.length > 0}/>
                  <button type="button" onClick={uploadToIpfs} disabled={imageUrl.length > 0}>Upload</button>
                </div>
              )}
              {file && (<div>Image Uploaded Successfully</div>)}
              <button className={styles.submit} type="button" onClick={mintNative}>Mint</button>
            </>
          )}

          {mintOption === 'existing' && (
            <>
              {allowedTokens.length > 0 ? (
                renderExistingTokenButtons()
              ) : (
                <p>No tokens available for minting with this wallet address.</p>
              )}
            </>
          )}
        </form>
      </div>
    </>
  )
}

export default MintFungibleTokens;
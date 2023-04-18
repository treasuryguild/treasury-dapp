import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import type { Asset } from '@meshsdk/core';
import { useRouter } from 'next/router'
import axios from 'axios';

function Deworkbulktx() {

  const tickerAPI = 'http://localhost:3000/api/tickers'
  //const tickerAPI = 'https://community-treasury-dapp.netlify.app/api/tickers'
  
  const router = useRouter();
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'' | any>('')
  const [doneTxHash, setDoneTxHash] = useState<'' | any>('')
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}]);}
  }, [connected]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    let tokenNames: string[] = []
    let tokenFingerprint: any[] = []
    let tokenAmounts: any[] = []
    let finalTokenAmount = 0
    let tokenUnits: any[] = []
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails",tickerDetails.data.tickerApiNames)
    let walletBalance = await wallet.getBalance();
    const assets = await wallet.getAssets();
    let totalAmount = parseFloat(walletBalance[0].quantity).toFixed(6)
    let finalamount = (parseFloat(totalAmount)/1000000).toFixed(6)
    let tokens = [{"id":"1","name":"ADA","amount":parseFloat(finalamount).toFixed(6),"unit":"lovelace", "decimals": 6, "fingerprint":""}]
    assets.map(asset => {
      if (asset.quantity > 1) {
        tokenNames.push((asset.assetName).slice(0,4))
        tokenFingerprint.push(asset.fingerprint)
        tokenUnits.push(asset.unit)
        if (asset.fingerprint === tickerDetails.data.tickerFingerprints[asset.assetName]) {
          console.log("asset.assetName",asset.assetName)
          finalTokenAmount = asset.quantity/(10**tickerDetails.data.tickerDecimals[asset.assetName])
        } else {
          finalTokenAmount = (parseFloat(asset.quantity)/1000000)
        }
        tokenAmounts.push((finalTokenAmount).toFixed(6))
      }
    })
    setWalletTokenUnits(tokenUnits);
    if (tokenNames.includes("gimbal")) {
      const index = tokenNames.indexOf("gimbal");
      tokenNames[index] = "GMBL";
    }
    tokenNames.map((name, index) => {
      tokens.push(JSON.parse(`{"id":"${index+2}","name":"${name}","amount":${tokenAmounts[index]}, "unit":"${tokenUnits[index]}", "fingerprint":"${tokenFingerprint[index]}"}`))
    })
    setWalletTokens(tokens);
    console.log("walletBalance", walletBalance[0].quantity, tokens)
    await getAssetDetails(tokens);
    await getEchangeRate(tokens);
  }

  async function getAssetDetails(tokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let updatedTokens = tokens
    const usedAddresses = await wallet.getUsedAddresses();
    try {
      await axios.get(`https://pool.pm/wallet/${usedAddresses[0]}`).then(response => {
        const details = response.data;
        console.log("AssestDetails",details);
        for (let i in response.data.tokens) {
          if (response.data.tokens[i].decimals) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tokens[i].fingerprint) {
                updatedTokens[j]['name'] = response.data.tokens[i].metadata.ticker
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tokens[i].metadata.decimals;
              }
            }
          }
        }
        });
      // continue with the signed transaction
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //try api
      await axios.get(tickerAPI).then(response => {
        const details = response.data;
        console.log("AssestDetails",details);
        for (let i in response.data.tickerApiNames) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tickerFingerprints[i]) {
                updatedTokens[j]['name'] = i;
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i];
              } else {
                updatedTokens[j]['decimals'] = 6;
              }
            }
        }
        });
      // handle the error as appropriate
    }
    
    console.log("New Token Details", updatedTokens)
    setWalletTokens(updatedTokens);
  }
  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }
  
  async function buildTx(assetsPerAddress: any, adaPerAddress: any, metaData: any) {
    let txHash = ""

    const tx = new Transaction({ initiator: wallet });

    for (let i in adaPerAddress) {
      if (adaPerAddress[i].length > 0) {
        if (adaPerAddress[i][0].quantity > 0) {
          tx.sendLovelace(i, adaPerAddress[i][0].quantity);
        }
      }
    }

    for (let j in assetsPerAddress) {
      tx.sendAssets(j, assetsPerAddress[j]);
    }
  
    tx.setMetadata(674, metaData);

      let unsignedTx = ""
      try {
        unsignedTx = await tx.build();
        console.log("unsignedTx",unsignedTx)
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        window.location.reload();
        // handle the error as appropriate
      }
      let signedTx = ""
      try {
        signedTx = await wallet.signTx(unsignedTx);
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        window.location.reload();
        // handle the error as appropriate
      }
    txHash = await wallet.submitTx(signedTx);
    console.log("txHash",txHash) 
    return txHash;
  }

  async function executeTransaction(assetsPerAddress: any, adaPerAddress: any, metaData: any) {
    console.log("executeTransaction",assetsPerAddress, adaPerAddress, metaData)
    const txid = await buildTx(assetsPerAddress, adaPerAddress, metaData);
    setDoneTxHash(txid)
    console.log("txid",txid, "doneTxHash", doneTxHash)
    return txid;
  }

  function getValue(name: string){
    let element: HTMLElement | any
    element = document.getElementById(name)
    return element.value
  }

  async function getEchangeRate(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let currentXchangeRate = ""
    console.log("Exchange Rate wallet tokens", wallettokens)
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails",tickerDetails.data.tickerApiNames)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates: any
    tokenExchangeRates = {}
    for (let i in wallettokens) {
      if (wallettokens[i].name == "ADA") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        let exchangeToken: any;
        exchangeToken = wallettokens[i].name
        tokenExchangeRates[exchangeToken] = 0.00
        tokenExchangeRates[exchangeToken] = parseFloat(rate).toFixed(3)
        let xrates: HTMLElement | any
        xrates = document.getElementById('xrate')
        xrates.value = parseFloat(rate).toFixed(3);
        currentXchangeRate = parseFloat(rate).toFixed(3);
        console.log("exchangeAda",rate);
        });
      } else if (wallettokens[i].name != "GMBL") {
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`).then(response => {
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        let exchangeToken: any;
        exchangeToken = wallettokens[i].name
        tokenExchangeRates[exchangeToken] = 0.00
        tokenExchangeRates[exchangeToken] = parseFloat(rate).toFixed(3)
        console.log("exchangeAda",rate);
        });
      }
    }
    setTokenRates(tokenExchangeRates)
    console.log("tokenExchangeRates",tokenExchangeRates)
  }
  
  async function getValues() {
    let addresses: any[] = [];
    let sendAssets: any[] = [];
    let sendAda: any[] = [];
    let assetsPerAddress: any;
    let adaPerAddress: any;
    let metaData: any;
    assetsPerAddress = {}
    adaPerAddress = {}
    metaData = {}
    //await axios.get('https://raw.githubusercontent.com/treasuryguild/treasury-system-v4/main/data/exampleMetaData.json').then(response => {
      //const deworkJson = response.data
      let deworkJson: any;
      const element = document.getElementById('deworkJson') as HTMLInputElement | null;
      deworkJson = JSON.parse(element?.value ?? "{}");
      console.log('Building', deworkJson);
      metaData = deworkJson.metadata['674']
      console.log('Building',deworkJson.outputs)

      for (let i in deworkJson.outputs) {
        sendAssets = []
        sendAda = []
        addresses.push(i)
        console.log("deworkJson.outputs[i]",deworkJson.outputs[i][0],i)
        for (let j in deworkJson.outputs[i]) {
          for (let k in walletTokens) {
            if ((walletTokens[k].unit).startsWith(deworkJson.outputs[i][j].policyId)) {
              console.log("Final result",deworkJson.outputs[i][j].quantity,walletTokens[j].name)
              sendAssets.push(JSON.parse(`{"unit":"${walletTokens[k].unit}","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            } else if ((deworkJson.outputs[i][j].policyId).toUpperCase() == "ADA" && (walletTokens[k].name).toUpperCase() == "ADA") { //Made it like this to show that we're looking for ADA amount
              console.log("Final result",deworkJson.outputs[i][j].quantity,walletTokens[j].name)
              sendAda.push(JSON.parse(`{"unit":"ADA","quantity":"${deworkJson.outputs[i][j].quantity}"}`))
            }
          }
        }
        assetsPerAddress[i] = sendAssets
        adaPerAddress[i] = sendAda
      }
    //})
    console.log("assetsPerAddress",assetsPerAddress, adaPerAddress, metaData, walletTokens)
    let thash = await executeTransaction(assetsPerAddress, adaPerAddress, metaData)
    console.log("thash",thash)
    setTimeout(function() {
      router.push(`/transactions/${thash}`)
    }, 1000); // 3000 milliseconds = 3 seconds
  }
    return (
      <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>Dework Transaction Builder</h1>
        </div>
        <div className={styles.body}>
          <div className={styles.form}>
          <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='xrate'
                    name='xrate'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Ex. 0.3</span>
                <span className={styles.tag}>Exchange Rate</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <textarea
                    id='deworkJson'
                    name='deworkJson'
                    autoComplete="off"
                    required
                />
                <span className={styles.tag}>Paste Json in here</span>
              </label>
            </div>
          </div>
          <div className={styles.balances}>
            <div><h2>Token Balances</h2></div>
            <div>
            {walletTokens.map((token: { id: Key | null | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; amount: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; }) => {
              return (                
                <p key={token.id}>{token.name} {token.amount}</p>
              )
            })}
            </div>
          </div>
        </div> 
        <div className={styles.submit}>
          <div>
            <button className={styles.submitbut}
              type="button"
              onClick={() => getValues()}
              >Build
            </button>
          </div>
        </div>
      </div>
      </>
    )
  }
  
  export default Deworkbulktx

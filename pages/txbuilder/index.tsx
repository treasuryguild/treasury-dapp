import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import type { Asset } from '@meshsdk/core';
import { useRouter } from 'next/router'
import TransactionBuilder from '../../components/TransactionBuilder';
import ContributionBuilder from '../../components/ContributionBuilder'
import { Contribution } from '../../components/ContributionBuilder';
import { ContributionBuilderProps } from '../../components/ContributionBuilder';
import SwitchingComponent from '../../components/SwitchingComponent';
import { fetchWallets } from "../../utils/fetchWallets";
import { getTxAmounts } from "../../utils/gettxamounts";
import axios from 'axios';
import supabase from "../../lib/supabaseClient";
import { Address, StakeCredential, RewardAddress } from '@emurgo/cardano-serialization-lib-asmjs';


type OptionsType = Array<{value: string, label: string}>;
type Token = {
    id: string | number;
    name: React.ReactNode;
    amount: React.ReactNode;
  };

function TxBuilder() {
  const tickerAPI = 'http://localhost:3000/api/tickers'
  //const tickerAPI = 'https://community-treasury-dapp.netlify.app/api/tickers'
  let customFilePath = '';
  let customFileContent = '';
  let project: any[] = [];
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'' | any>('')
  const [projectName, setProjectName] = useState<'' | any>('')
  const [doneTxHash, setDoneTxHash] = useState<'' | any>('')
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [myVariable, setMyVariable] = useState<{} | any>({})
  const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])
  const [labelOptions, setLabelOptions] = useState<OptionsType>([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: 'Content Creation', label: 'Content Creation' },
  ]);

  const [contributionsJSON, setContributionsJSON] = useState('');
  const [contributorWalletsJSON, setContributorWalletsJSON] = useState('');
  const handleContributionsUpdate = (contributions: Contribution[]) => {
    setContributionsJSON(JSON.stringify(contributions, null, 2));
  };

  const handleContributorWalletsUpdate = (contributorWallets: Contribution[]) => {
    setContributorWalletsJSON(JSON.stringify(contributorWallets, null, 2));
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const contributionBuilderProps: ContributionBuilderProps = { // create an object with the props you want to pass
    executeTransaction: executeTransaction,
    onContributionsUpdate: handleContributionsUpdate,
    onContributorWalletsUpdate: handleContributorWalletsUpdate,
    myVariable: myVariable,
    walletTokens: walletTokens,
    labels: labelOptions,
    tokenRates: tokenRates
  }

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}]);}
  }, [connected]);

  useEffect(() => {
    console.log("myVariable", myVariable);
  }, [myVariable]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    const usedAddresses = await wallet.getUsedAddresses();
    let projectInfo: any;
    projectInfo = await getProject(usedAddresses[0])
    console.log("myVariable",myVariable)
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
        tokenNames.push((asset.assetName))
        tokenFingerprint.push(asset.fingerprint)
        tokenUnits.push(asset.unit)
        console.log("Testing ticker fingerprint", asset.fingerprint, tickerDetails.data.tickerFingerprints[asset.assetName])
        if (asset.fingerprint === tickerDetails.data.tickerFingerprints[asset.assetName]) {
          console.log("asset.assetName",asset.assetName)
          finalTokenAmount = asset.quantity/(10**tickerDetails.data.tickerDecimals[asset.assetName])
        } else {
          finalTokenAmount = (parseFloat(asset.quantity))
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
    if (projectInfo.project != undefined) {
      await getAssetDetails(tokens);
      await getEchangeRate(tokens);
    }
  }

  async function getProject(address: string) {
    let projectname = ''
    let groupInfo = {}
      try {
        const { data, error, status } = await supabase
        .from("projects")
        .select('project_name, project_type, groups(group_name)')
        .eq("wallet", address);

        if (error && status !== 406) throw error
        if (data) {
          project = data
          if (project.length == 0) {
            projectname = ''
            groupInfo = {}
            router.push('/newwallet')
          } else {
            setProjectName(project[0].project_name);
            projectname = project[0].project_name
            
            groupInfo = JSON.parse(`{"group":"${project[0]['groups'].group_name}","project":"${project[0].project_name}","project_type":"${project[0].project_type}"}`)
            setMyVariable(groupInfo);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    return groupInfo
  }

  async function getAssetDetails(tokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let updatedTokens = tokens
    const usedAddresses = await wallet.getUsedAddresses();
    try {
      await axios.get(`https://pool.pm/wallet/${usedAddresses[0]}`).then(response => {
        const details = response.data;
        console.log("AssestDetails",details);
        for (let i in response.data.tokens) {
          if (response.data.tokens[i].quantity > 1) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tokens[i].fingerprint) {
                updatedTokens[j]['name'] = response.data.tokens[i].metadata.ticker?response.data.tokens[i].metadata.ticker:response.data.tokens[i].metadata.symbol
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tokens[i].metadata.decimals?response.data.tokens[i].metadata.decimals:0;
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
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i]?response.data.tickerDecimals[i]:0;
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
        const txamounts = await getTxAmounts(unsignedTx)
        console.log('Tx amount:', txamounts, assetsPerAddress, walletTokens);
        for (let i in assetsPerAddress) {
          //console.log("assetsPerAddress[i]",assetsPerAddress[i])
          for (let j in assetsPerAddress[i]) {
            console.log("assetsPerAddress[i][j]", i, assetsPerAddress[i][j])
            for (let k in walletTokens) {
              if (assetsPerAddress[i][j].unit == walletTokens[k].unit) {
                if (txamounts[i][walletTokens[k].name] == undefined) {
                  txamounts[i][walletTokens[k].name] = 0
                }
                txamounts[i][walletTokens[k].name] = txamounts[i][walletTokens[k].name] + (parseInt(assetsPerAddress[i][j].quantity)/(10**parseInt(walletTokens[k].decimals)))
              }
            }
          }
        }
        console.log('Final Tx amount:', txamounts);
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        //window.location.reload();
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
      console.log("wallettokens[i].name", wallettokens[i].name)
      if (wallettokens[i].name == "ADA" && myVariable) {
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
      } else if (wallettokens[i].name != "GMBL" && wallettokens[i].name != "GovWG" && myVariable) {
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
  
  return (
    <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>{projectName}</h1>
        </div>
        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.formitem}>
              <label className={styles.custom}>
                <input
                  type="text"
                  id="xrate"
                  name="xrate"
                  autoComplete="off"
                  required
                />
                <span className={styles.placeholder}>Ex. 0.3</span>
                <span className={styles.tag}>Exchange Rate</span>
              </label>
            </div>
            <div>
            <SwitchingComponent
              onClick={toggleVisibility}
              executeTransaction={executeTransaction}
              walletTokens={walletTokens}
              tokenRates={tokenRates}
              contributionBuilderProps={contributionBuilderProps}
              myVariable={myVariable}
            />
        </div>
          </div>
          <div className={styles.balances}>
            <div>
              <h2>Token Balances</h2>
            </div>
            <div>
              {walletTokens.map((token: Token) => {
                return (
                  <p key={token.id}>
                    {token.name} {token.amount}
                  </p>
                );
              })}
              {isVisible && (
        <div className={styles.preContainer}>
          <h3>Metadata</h3>
          <pre>{contributionsJSON}</pre>
        </div>
      )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
  }
  
  export default TxBuilder

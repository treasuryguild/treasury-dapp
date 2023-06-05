import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import { useRouter } from 'next/router'
import { Contribution } from '../../components/ContributionBuilder';
import { ContributionBuilderProps } from '../../components/ContributionBuilder';
import { TransactionBuilderProps } from '../../components/TransactionBuilder';
import SwitchingComponent from '../../components/SwitchingComponent';
import { getTxAmounts } from "../../utils/gettxamounts";
import axios from 'axios';
import supabase from "../../lib/supabaseClient";
import { sendDiscordMessage } from '../../utils/sendDiscordMessage'
import { commitFile } from '../../utils/commitFile'
import { updateTxDatabase } from '../../utils/updateTxDatabase'
import { updateTxInfo } from '../../utils/updateTxInfo'


type OptionsType = Array<{value: string, label: string}>;
type Token = {
    id: string | number;
    name: React.ReactNode;
    amount: React.ReactNode;
  };
let txdata = {}

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

  const transactionBuilderProps: TransactionBuilderProps = { // create an object with the props you want to pass
    executeTransaction: executeTransaction,
    myVariable: myVariable,
    walletTokens: walletTokens,
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
    projectInfo = await getProject(usedAddresses[0]);
    // Move this line here
    setMyVariable({
      ...myVariable,
      ...projectInfo,
      wallet: usedAddresses[0],
    });
    txdata = {...txdata,
      ...projectInfo,
      wallet: usedAddresses[0],}
    console.log("txdata",txdata)
    let tokenNames: string[] = []
    let tokenFingerprint: any[] = []
    let tokenAmounts: any[] = []
    let finalTokenAmount = 0
    let tokenUnits: any[] = []
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails",tickerDetails.data.tickerApiNames)
    let walletBalance = await wallet.getBalance();
    const assets = await wallet.getAssets();
    console.log("assetss", assets)
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
          finalTokenAmount = (parseFloat(asset.quantity))
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
    let projectWebsite = ''
    let projectId = ''
    let groupInfo = {}
      try {
        const { data, error, status } = await supabase
        .from("projects")
        .select('project_name, project_type, project_id, website, groups(group_name, logo_url)')
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
            projectname = project[0].project_name;
            projectWebsite = project[0].website;
            projectId = project[0].project_id;
            groupInfo = JSON.parse(`{"group":"${project[0]['groups'].group_name}","project":"${project[0].project_name}","project_id":"${project[0].project_id}","project_type":"${project[0].project_type}","project_website":"${project[0].website}","logo_url":"${project[0]['groups'].logo_url}"}`)
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
                updatedTokens[j]['amount'] = (parseFloat(updatedTokens[j]['amount'])/10**updatedTokens[j]['decimals']).toFixed(updatedTokens[j]['decimals'])
                console.log("Testing token result", updatedTokens[j]['decimals'])
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
        console.log("Ticker AssestDetails",details);
        for (let i in response.data.tickerApiNames) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tickerFingerprints[i]) {
                updatedTokens[j]['name'] = i;
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i]?response.data.tickerDecimals[i]:0;
                updatedTokens[j]['amount'] = (parseFloat(updatedTokens[j]['amount'])/10**updatedTokens[j]['decimals']).toFixed(updatedTokens[j]['decimals'])
                console.log("Testing token result for tickers", updatedTokens[j]['decimals'])
              }
            }
        }
        });
      // handle the error as appropriate
    }
    
    console.log("New Token Details", updatedTokens)
    setWalletTokens(updatedTokens);
  }

  interface IToken {
    amount: string;
    decimals: number;
    id: string;
    name: string;
    unit: string;
    fingerprint?: string;
  }
  
  interface ITotalAmounts {
    [key: string]: number;
  }
  
  function calculateWalletBalanceAfterTx(totalAmounts: ITotalAmounts, walletTokens: IToken[], fee: number): IToken[] {
    const walletBalanceAfterTx: IToken[] = walletTokens.map(token => {
      const tokenName = token.name;
      const totalAmount = totalAmounts[tokenName] || 0;
      const feeAmount = tokenName === 'ADA' ? fee / 1000000 : 0;
      let newBalance = parseFloat(token.amount) - totalAmount - feeAmount;
      if (tokenName === 'ADA') {
        newBalance = parseFloat(newBalance.toFixed(6)); // ensure ADA has at most 6 decimal places
      }
      return {
        ...token,
        amount: newBalance.toString(),
      };
    });
    return walletBalanceAfterTx;
  }
  
  function formatWalletBalance(walletBalanceAfterTx: IToken[]): string {
    const formattedBalances = walletBalanceAfterTx.map(item => {
        return `${item.amount} ${item.name}`;
    });

    return formattedBalances.join(' ');
  }

  function formatTotalAmounts(totalAmounts: ITotalAmounts): string {
    let totalAmountsString = '';
    Object.entries(totalAmounts).forEach(([key, value]) => {
      totalAmountsString += `* ${value} ${key}\n`;
    });
    return totalAmountsString;
  }

  interface Contribution1 {
    taskCreator: string;
    label: string;
    name?: string[];
    description?: string[]; // description might be undefined
    contributors: { [key: string]: { [key: string]: string } }; // can contain any token, not just ADA or AGIX
}
  
  interface Metadata {
      mdVersion: string[];
      txid: string;
      msg: string[];
      contributions: Contribution1[];
  }
  
  function processMetadata(metadata: Metadata): string {
    if (metadata.contributions.length === 1) {
        const contribution = metadata.contributions[0];
        if (contribution.name && contribution.name.length > 0) {
            return contribution.name.join(' ');
        } else if (contribution.description && contribution.description.length > 0) {
            return contribution.description.join(' ');
        }
    } else {
        const recipientsMsg = metadata.msg.find(msg => msg.startsWith("Recipients: "));
        if (recipientsMsg) {
            const numberOfRecipients = recipientsMsg.split(' ')[1];
            return `Rewards to ${numberOfRecipients} contributors`;
        }
    }
    return '';
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
        const { txamounts, fee } = getTxAmounts(unsignedTx)
        console.log('Tx amount:', txamounts, fee, assetsPerAddress, walletTokens);
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
        
        let totalAmounts: any = {};
          for (let i in txamounts) {
            for (let j in txamounts[i]) {
              if (totalAmounts[j] === undefined) {
                totalAmounts[j] = 0;
              }
              totalAmounts[j] += txamounts[i][j];
            }
          }

        let date = new Date();
        let originalDateString = date.toISOString();
        const originalDate = new Date(originalDateString);
        const year = originalDate.getUTCFullYear();
        const month = String(originalDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(originalDate.getUTCDate()).padStart(2, '0');
        const hours = String(originalDate.getUTCHours()).padStart(2, '0');
        const minutes = String(originalDate.getUTCMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}: UTC`;
        const txdescription = processMetadata(metaData)
        totalAmounts.ADA = parseFloat(totalAmounts.ADA.toFixed(6));
        const walletBalanceAfterTx: IToken[] = calculateWalletBalanceAfterTx(totalAmounts, walletTokens, fee);
        const balanceString = formatWalletBalance(walletBalanceAfterTx)
        const totalAmountsString = formatTotalAmounts(totalAmounts)

        txdata = {
          ...txdata,
          txamounts: txamounts,
          fee: fee,
          totalAmounts: totalAmounts,
          walletTokens: walletTokens,
          walletBalanceAfterTx: walletBalanceAfterTx,
          balanceString: balanceString,
          totalAmountsString: totalAmountsString,
          txdescription: txdescription,
          formattedDate: formattedDate,
          tokenRates: tokenRates
        }
        console.log('Final totalAmounts:', totalAmounts);
        console.log('Final Tx amount:', txamounts, myVariable, "txdata", txdata);
        // continue with the signed transaction
        
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        //window.location.reload();
        // handle the error as appropriate
      }
      console.log("metaData", metaData)
      let signedTx = ""
      try {
        signedTx = await wallet.signTx(unsignedTx);
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        //window.location.reload();
        // handle the error as appropriate
      }
    txHash = await wallet.submitTx(signedTx);
    txdata = {
      ...txdata,
      txHash: txHash,
      txtype: 'Outgoing'
    }
    console.log("txHash",txHash) 
    return txHash;
  }

  async function executeTransaction(assetsPerAddress: any, adaPerAddress: any, metaData: any): Promise<string> {
    console.log("executeTransaction",assetsPerAddress, adaPerAddress, metaData)
    let customFilePath = '';
    let customFileContent = '';
    let completedTxFilePath = '';
    let completedTxFileContent = '';
    const txid: string = await buildTx(assetsPerAddress, adaPerAddress, metaData);
    
    setDoneTxHash(txid)
    console.log("txid",txid, "doneTxHash", doneTxHash)
    
    // Use a promise to wait for state update
    return new Promise<string>(async(resolve, reject) => {
        const updatedVariable = {
            ...myVariable,
            ...txdata
        };
        
        setMyVariable(updatedVariable);
        
        try {
            setLoading(true)
            let newMetaData = metaData
            newMetaData['txid'] = txid
            console.log("newMetaData",newMetaData)
            customFileContent = `${JSON.stringify(newMetaData, null, 2)}`;
            let pType = ''
            if (myVariable.project_type == 'Treasury Wallet') {
              pType = 'TreasuryWallet'
            }
            customFilePath = `Transactions/${(myVariable.group).replace(/\s/g, '-')}/${pType}/${(myVariable.project).replace(/\s/g, '-')}/bulkTransactions/${new Date().getTime().toString()}-TEst2.json`;
            await commitFile(customFilePath, customFileContent)
            await updateTxInfo(updatedVariable, newMetaData, txid, customFilePath)
            await sendDiscordMessage(updatedVariable);
            setLoading(false)
            resolve(txid);
            router.push(`/transactions/${txid}`)
        } catch (error) {
            console.error("Error sending Discord message:", error);
            reject(error);
        }
    });
}

  async function getEchangeRate(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    console.log("Exchange Rate wallet tokens", wallettokens)
    let tickerDetails = await axios.get(tickerAPI)
    console.log("tickerDetails", tickerDetails.data.tickerApiNames)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates: any = {}
    for (let i in wallettokens) {
      console.log("wallettokens[i].name", wallettokens[i].name)
      try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`)
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        if (rate !== undefined) {
          tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
          console.log("exchangeRate", rate);
          if (wallettokens[i].name == "ADA") {
            let xrates: HTMLElement | any
            xrates = document.getElementById('xrate')
            xrates.value = parseFloat(rate).toFixed(3);
          }
        } else {
          tokenExchangeRates[wallettokens[i].name] = 0.00
        }
      } catch (error) {
        console.log(`Failed to get exchange rate for ${wallettokens[i].name}: `, error);
        tokenExchangeRates[wallettokens[i].name] = 0.00
      }
    }
    setTokenRates(tokenExchangeRates)
    console.log("tokenExchangeRates", tokenExchangeRates)
  }  
  
  return (
    <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>{projectName}</h1>
        </div>
        {!loading && (<div>Test</div>)}
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
                transactionBuilderProps={transactionBuilderProps}
                contributionBuilderProps={contributionBuilderProps}
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

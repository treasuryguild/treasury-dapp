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
import { get, set } from '../../utils/cache'
import { getProject } from '../../utils/getProject'
import { checkTxStatus } from '../../utils/checkTxStatus'
import { getAssetList } from '../../utils/getassetlist'
import { getAssetList2 } from '../../utils/getassetlist2'
import { getExchangeRate } from '../../utils/getexchangerate'
import { getLabels } from '../../utils/getLabels'
import { setLabels } from '../../utils/setLabels'
import { updateTxDatabase } from '../../utils/updateTxDatabase'
import { updateTxInfo } from '../../utils/updateTxInfo'
import { checkAndUpdate } from '../../utils/checkAndUpdate'
import { useMyVariable } from '../../context/MyVariableContext';


type OptionsType = Array<{value: string, label: string}>;
type Token = {
    id: string | number;
    name: React.ReactNode;
    displayname: React.ReactNode;
    amount: React.ReactNode;
    tokenType: string;
  };
let txdata: any = {}

function TxBuilder() {
  const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}` 
  let project: any[] = [];
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'' | any>('')
  const [projectName, setProjectName] = useState<'' | any>('')
  const [doneTxHash, setDoneTxHash] = useState<'' | any>('')
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const { myVariable, setMyVariable } = useMyVariable();
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

  const contributionBuilderProps: ContributionBuilderProps = { 
    executeTransaction: executeTransaction,
    onContributionsUpdate: handleContributionsUpdate,
    onContributorWalletsUpdate: handleContributorWalletsUpdate,
    walletTokens: walletTokens,
    labels: labelOptions,
    tokenRates: tokenRates
  }

  const transactionBuilderProps: TransactionBuilderProps = { 
    executeTransaction: executeTransaction,
    walletTokens: walletTokens,
    tokenRates: tokenRates
  }

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}]);}
  }, [connected]);

  useEffect(() => {
    console.log("Changed")
  }, [myVariable]);

  interface InputLabels {
    label: string;
  }
  
  interface OutputLabels {
    value: string;
    label: string;
  }
  
  function transformArrayToObject(arr: InputLabels[]): OutputLabels[] {
    return arr.map(obj => ({
      value: obj.label,
      label: obj.label
    }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    setTokenRates({})
    const databaseLabels = await getLabels();
    const output: OutputLabels[] = transformArrayToObject(databaseLabels);
    //console.log(databaseLabels, output)
    setLabelOptions(output);
    //const status = await setLabels(["Test"]);
    const usedAddresses = await wallet.getUsedAddresses();
    let projectInfo: any;
    projectInfo = await getProject(usedAddresses[0]);
    if (Object.keys(projectInfo).length === 0) {
      router.push('/newwallet')
    }
    setProjectName(projectInfo.project);
    setMyVariable({
      ...myVariable,
      ...projectInfo,
      wallet: usedAddresses[0],
    });
    txdata = {...txdata,
      ...projectInfo,
      wallet: usedAddresses[0],}

      let transactionStatus: any = false;
    
      //Loop to keep checking the transaction status every 30 seconds
      while (transactionStatus == false) {
          transactionStatus = await checkTxStatus(usedAddresses[0]);
          if (!transactionStatus) {
              //Wait for 20 seconds
              await new Promise(resolve => setTimeout(resolve, 20000));
          } else {
              break;
          }
      }
      setTxStatus(transactionStatus);
        
      let assets = await getAssetList(usedAddresses[0]);
      setWalletTokens(assets);
      //console.log("getAssetList", assets)
      if (projectInfo.project != undefined && transactionStatus) {
        await getTokenRates(assets);
      }
  }

  interface IToken {
    amount: string;
    decimals: number;
    id: string;
    name: string;
    displayname: string;
    unit: string;
    fingerprint?: string;
    tokenType: string;
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
  
  function formatWalletBalance(walletBalanceAfterTx: Token[]): string {
    const formattedBalances = walletBalanceAfterTx.map((item: Token) => {
        const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as string);
        if (item.tokenType == "fungible") {
          return `* ${amount.toFixed(2)} ${item.name}\n`;
        }
    });
  
    return formattedBalances.join('');
  }

  function formatTotalAmounts(totalAmounts: ITotalAmounts): string {
    let totalAmountsString = '';
    for (let token in totalAmounts) {
      const walletToken = txdata.walletTokens.find((t: any) => t.name === token);
      if (walletToken.tokenType === 'fungible') {
        totalAmountsString += `* ${totalAmounts[token]} ${token}\n`;
      } else {
        totalAmountsString += `* ${totalAmounts[token]} ${walletToken.displayname}\n`;
      }
    }
    /*Object.entries(totalAmounts).forEach(([key, value]) => {
      totalAmountsString += `* ${value} ${key}\n`;
    });*/
    //console.log("totalAmountsString", totalAmountsString)
    return totalAmountsString;
  }

  interface Contribution1 {
    taskCreator: string;
    label: string;
    name?: string[];
    description?: string[]; 
    contributors: { [key: string]: { [key: string]: string } }; 
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
        const { txamounts, fee } = getTxAmounts(unsignedTx)
        for (let i in assetsPerAddress) {
          for (let j in assetsPerAddress[i]) {
            for (let k in walletTokens) {
              if (assetsPerAddress[i][j].unit == walletTokens[k].unit) {
                if (txamounts[i][walletTokens[k].name] == undefined) {
                  txamounts[i][walletTokens[k].name] = 0
                }
                txamounts[i][walletTokens[k].name] = txamounts[i][walletTokens[k].name] + (parseInt(assetsPerAddress[i][j].quantity)/(10**parseInt(walletTokens[k].decimals?walletTokens[k].decimals:0)))
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
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes} UTC`;
        const txdescription = processMetadata(metaData)
        totalAmounts.ADA = parseFloat(totalAmounts.ADA.toFixed(6));
        const walletBalanceAfterTx: IToken[] = calculateWalletBalanceAfterTx(totalAmounts, walletTokens, fee);
        const balanceString = formatWalletBalance(walletBalanceAfterTx)
        
        //console.log("monthly_wallet_budget_string", monthly_wallet_budget_string)
        txdata = {
          ...txdata,
          txamounts: txamounts,
          fee: fee,
          totalAmounts: totalAmounts,
          walletTokens: walletTokens,
          walletBalanceAfterTx: walletBalanceAfterTx,
          balanceString: balanceString,
          txdescription: txdescription,
          formattedDate: formattedDate,
          tokenRates: tokenRates,
          txtype: 'Outgoing'
        }
        let monthly_budget_balance: any = JSON.parse(JSON.stringify(txdata.monthly_budget));

        if (txdata.project == "Singularity Net Ambassador Wallet" && Number(totalAmounts.AGIX) > 0) {
            if (!monthly_budget_balance) {
                monthly_budget_balance = {}
            }
            if (!monthly_budget_balance[myVariable.budget_month]) {
              monthly_budget_balance[myVariable.budget_month] = {}
            }
            monthly_budget_balance[myVariable.budget_month]["AGIX"] = (Number(txdata.monthly_budget[myVariable.budget_month]["AGIX"]) || 0) - Number(totalAmounts.AGIX);
            monthly_budget_balance[myVariable.budget_month]["AGIX"] = typeof monthly_budget_balance[myVariable.budget_month]["AGIX"] === 'number' ? monthly_budget_balance[myVariable.budget_month]["AGIX"].toFixed(2) : parseFloat(monthly_budget_balance[myVariable.budget_month]["AGIX"] as string).toFixed(2);
        }
        
        if (txdata.project == "Test Wallet") {
            for (let token in totalAmounts) {
                const walletToken = txdata.walletTokens.find((t: any) => t.name === token);
                if (walletToken && walletToken.tokenType === 'fungible' && totalAmounts[token] > 0) {
                  if (!monthly_budget_balance) {
                    monthly_budget_balance = {}
                  }
                  if (!monthly_budget_balance[myVariable.budget_month]) {
                    monthly_budget_balance[myVariable.budget_month] = {}
                  }
                    monthly_budget_balance[myVariable.budget_month][token] = ((Number(txdata.monthly_budget[myVariable.budget_month][token]) || 0) - Number(totalAmounts[token]));
                    monthly_budget_balance[myVariable.budget_month][token] = typeof monthly_budget_balance[myVariable.budget_month][token] === 'number' ? monthly_budget_balance[myVariable.budget_month][token].toFixed(2) : parseFloat(monthly_budget_balance[myVariable.budget_month][token] as string).toFixed(2);
                }
            }
        }
        let monthly_budget_balance_strings:any = {}
        // Create a formatted string for each month's budget balance
        for (let month in monthly_budget_balance) {
            monthly_budget_balance_strings[month] = formatTotalAmounts(monthly_budget_balance[month]);
        }
      let d = new Date();
      d.setMonth(d.getMonth() + 1, 1); // Set the day to 1 to avoid end of month discrepancies
      d.setHours(0, 0, 0, 0); // Reset time portion to avoid timezone and daylight saving time issues
      const totalAmountsString = formatTotalAmounts(totalAmounts)             
      const monthly_wallet_budget_string = monthly_budget_balance_strings[d.toISOString().slice(0, 7)]
      //console.log("This month", d.toISOString().slice(0, 7))
      txdata = {
        ...txdata,
        monthly_budget_balance,
        monthly_wallet_budget_string,
        totalAmountsString,
      }
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //router.push('/cancelwallet')
        //window.location.reload();
      }
      let signedTx = ""
      //console.log("txdata", txdata)
      try {
        signedTx = await wallet.signTx(unsignedTx);
        // continue with the signed transaction
      } catch (error) {
        console.error('An error occurred while signing the transaction:', error);
        //alert(error)
        //router.push('/cancelwallet')
        //window.location.reload();
      }
    txHash = await wallet.submitTx(signedTx);
    txdata = {
      ...txdata,
      txHash: txHash
    }
    return txHash;
  }

  async function executeTransaction(assetsPerAddress: any, adaPerAddress: any, metaData: any): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let customFilePath = '';
        let customFileContent = '';
        let txid: string = '';
        txid = await buildTx(assetsPerAddress, adaPerAddress, metaData);
        setDoneTxHash(txid);
  
        const updatedVariable = {
          ...myVariable,
          ...txdata
        };
        
        setMyVariable(updatedVariable);
  
        setLoading(true);
        let newMetaData = metaData;
        newMetaData['txid'] = txid;
        customFileContent = `${JSON.stringify(newMetaData, null, 2)}`;
        let pType = '';
  
        if (myVariable.project_type == 'Treasury Wallet') {
          pType = 'TreasuryWallet';
        } else {
          let prepType = myVariable.project_type.replace(/\s/g, '');
          pType = prepType.replace("Proposal", '');
        }

        customFilePath = `Transactions/${(myVariable.group).replace(/\s/g, '-')}/${pType}/${(myVariable.project).replace(/\s/g, '-')}/bulkTransactions/${new Date().getTime().toString()}-${(myVariable.group).replace(/\s/g, '-')}-bulkTransaction.json`;

        resolve(txid);
        await updateTxInfo(updatedVariable, newMetaData, txid, customFilePath);
        //await updateTxDatabase(updatedVariable, newMetaData, txid, customFilePath); // for testing
        router.push(`/done/${txid}`);
        setLoading(false);
      } catch (error) {
        console.error("Error updating TxInfo message:", error);
        reject(error);
        if (typeof error === 'object' && error !== null && 'message' in error) {
          alert((error as Error).message);
          console.log((error as Error).message);
        } else {
          alert(error);
          console.log(error);
        }  
      }
    });
  }  

  async function getTokenRates(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    // Extract token names from wallettokens
    const tokenNames = wallettokens.map(token => token.name);
    const cachedData = get('rates');
  
    let tokenExchangeRates:any = {};
    
    // If we have cachedData and the token names have not changed, use the cached rates
    if (cachedData && JSON.stringify(cachedData.tokens) === JSON.stringify(tokenNames)) {
      tokenExchangeRates = cachedData.data;
      setTokenRates(tokenExchangeRates);
      if (tokenExchangeRates['ADA'] !== undefined) {
        let xrates:any = document.getElementById('xrate');
        xrates.value = tokenExchangeRates['ADA'];
      }
    } else {
      // If the token names have changed, or we don't have cached data, fetch the rates
      tokenExchangeRates = await getExchangeRate(wallettokens);
      set('rates', tokenExchangeRates, tokenNames); // Save the new rates and token names in cache
      setTokenRates(tokenExchangeRates);
    }
    //console.log("tokenrates", tokenExchangeRates, wallettokens);
  }   
  
  return (
    <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>{projectName}</h1>
        </div>
        {!loading && !connected && (
          <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>Please connect wallet</div>
            </div>
          </div>)}
        {connected && !loading && !txStatus && projectName && (
          <div className={styles.body}>
              <div className={styles.form}>
                <div className={styles.loading}>Tx still pending</div>
              </div>
          </div>
        )}
        {connected && !loading && !txStatus && !projectName && (
          <div className={styles.body}>
              <div className={styles.form}>
                <div className={styles.loading}>Loading wallet...</div>
              </div>
          </div>
        )}
        {loading && (
          <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>Executing...</div>
            </div>
          </div>)}
        {!loading && connected && txStatus &&(
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
              {walletTokens.some((token: Token) => token.tokenType === "fungible") && <h3 className={styles.tokenheading}>Fungible Tokens</h3>}
                {walletTokens.map((token: Token) => {
                  if (token.tokenType === "fungible") {
                    return (
                      <p key={token.id}>
                        {token.displayname} {token.amount}
                      </p>
                    );
                  }
                  return null; // Return null if tokenType is not "fungible"
                })}
                
                {walletTokens.some((token: Token) => token.tokenType === "nft") && <h3 className={styles.tokenheading}>NFTs</h3>}
                {walletTokens.map((token: Token) => {
                  if (token.tokenType === "nft") {
                    return (
                      <p key={token.id}>
                        {token.displayname} {token.amount}
                      </p>
                    );
                  }
                return null; // Return null if tokenType is not "nft"
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
        )} 
      </div>
    </>
  )
  }
  
  export default TxBuilder

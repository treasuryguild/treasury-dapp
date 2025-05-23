import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { Transaction } from '@meshsdk/core';
import { useRouter } from 'next/router'
import { Contribution } from '../../components/ContributionBuilder';
import { ContributionBuilderProps } from '../../components/ContributionBuilder';
import { TransactionBuilderProps } from '../../components/TransactionBuilder';
import { JsonGenTransactionBuilderProps } from '../../components/JsonGenTransactionBuilder';
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
import { setTokenTypes } from '../../utils/setTokenTypes'
import { getAssetList2 } from '../../utils/getassetlist2'
import { getExchangeRate } from '../../utils/getexchangerate'
import { getLabels } from '../../utils/getLabels'
import { getSubGroups } from '../../utils/getSubGroups'
import { updateTxDatabase } from '../../utils/updateTxDatabase'
import { updateTxInfo } from '../../utils/updateTxInfo'
import { checkAndUpdate } from '../../utils/checkAndUpdate'
import { useMyVariable } from '../../context/MyVariableContext';


type OptionsType = Array<{ value: string, label: string }>;
type OptionsType2 = Array<{ value: string, label: string }>;

type Token = {
  id: string | number;
  name: React.ReactNode;
  displayname: React.ReactNode;
  amount: React.ReactNode;
  tokenType: string;
};
let txdata: any = {}

type BuilderType = 'dework' | 'manual' | 'table' | 'JsonGen';

function TxBuilder() {
  const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}`
  let project: any[] = [];
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
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
  const [tokens, setTokens] = useState<[] | any>([{ "id": "1", "name": "ADA", "amount": 0.00, "unit": "lovelace", "decimals": 6 }])
  const [labelOptions, setLabelOptions] = useState<OptionsType>([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: 'Content Creation', label: 'Content Creation' },
  ]);
  const [subGroupOptions, setSubGroupOptions] = useState<OptionsType2>([
    { value: 'Writers Workgroup', label: 'Writers Workgroup' },
    { value: 'Video Workgroup', label: 'Video Workgroup' },
    { value: 'Archive Workgroup', label: 'Archive Workgroup' },
  ]);

  const [contributionsJSON, setContributionsJSON] = useState('');
  const [contributorWalletsJSON, setContributorWalletsJSON] = useState('');
  const handleContributionsUpdate = (contributions: Contribution[]) => {
    setContributionsJSON(JSON.stringify(contributions, null, 2));
  };

  const handleContributorWalletsUpdate = (contributorWallets: Contribution[]) => {
    setContributorWalletsJSON(JSON.stringify(contributorWallets, null, 2));
  };

  const [activeBuilder, setActiveBuilder] = useState<BuilderType>('dework');

  const handleSwitchBuilder = (builderType: BuilderType) => {
    setActiveBuilder(builderType);
    setIsVisible(builderType === 'manual' || builderType === 'table');
  };

  const contributionBuilderProps: ContributionBuilderProps = {
    executeTransaction: executeTransaction,
    onContributionsUpdate: handleContributionsUpdate,
    onContributorWalletsUpdate: handleContributorWalletsUpdate,
    walletTokens: walletTokens,
    labels: labelOptions,
    subGroups: subGroupOptions,
    tokenRates: tokenRates
  }

  const transactionBuilderProps: TransactionBuilderProps = {
    executeTransaction: executeTransaction,
    walletTokens: walletTokens,
    tokenRates: tokenRates
  }

  const jsonGenTransactionBuilderProps: JsonGenTransactionBuilderProps = {
    executeTransaction: executeTransaction,
    walletTokens: walletTokens,
    tokenRates: tokenRates
  }

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else { setTokens([{ "id": "1", "name": "ADA", "amount": 0.00, "unit": "lovelace", "decimals": 6 }]); }
  }, [connected]);

  useEffect(() => {
    console.log("Changed")
  }, [myVariable]);

  interface InputLabels {
    label: string;
  }

  interface InputLabels2 {
    sub_group: string;
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

  function transformArrayToObject2(arr: InputLabels2[]): OutputLabels[] {
    return arr.map(obj => ({
      value: obj.sub_group,
      label: obj.sub_group
    }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    setTokenRates({})

    const databaseLabels: any = await getLabels();
    const databaseSubGroups: any = await getSubGroups();
    const output: OutputLabels[] = transformArrayToObject(databaseLabels);
    const output2: OutputLabels[] = transformArrayToObject2(databaseSubGroups);
    setLabelOptions(output);
    setSubGroupOptions(output2);

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
    txdata = {
      ...txdata,
      ...projectInfo,
      wallet: usedAddresses[0],
    }

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
    if (projectInfo.project != undefined && transactionStatus) {
      await getTokenRates(assets);
    }
    let status = setTokenTypes(assets);
    //console.log("getAssetList", assets, status)
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
    arrayMap: { label: string[], subGroup: string[], date: string[] },
    //label: string;
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

  function getAggregatedAmounts(metaData: any) {
    let aggregatedAGIXPerMonth: any = {};

    metaData.contributions.forEach((contribution: any) => {
      let date = null;

      if (contribution.arrayMap && contribution.arrayMap.date) {
        date = contribution.arrayMap.date[0];
      }

      if (!date) {
        const currentDate = new Date();
        const currentDay = String(currentDate.getDate()).padStart(2, '0');
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const currentYear = String(currentDate.getFullYear()).slice(-2);
        date = `${currentDay}.${currentMonth}.${currentYear}`;
      }

      const yearMonth = `20${date.split(".")[2]}-${date.split(".")[1].padStart(2, '0')}`;
      const contributors = contribution.contributors;

      for (let contributor in contributors) {
        const AGIXAmount = Number(contributors[contributor].AGIX) || 0;
        if (aggregatedAGIXPerMonth[yearMonth] === undefined) {
          aggregatedAGIXPerMonth[yearMonth] = 0;
        }
        aggregatedAGIXPerMonth[yearMonth] += AGIXAmount;
      }
    });

    return aggregatedAGIXPerMonth;
  }

  function getAggregatedAmountsPerMonth(metaData: any) {
    // Initialize an empty object to store aggregated amounts per month for each token
    let aggregatedAmountsPerMonth: any = {};

    metaData.contributions.forEach((contribution: any) => {
      let date = null;

      if (contribution.arrayMap && contribution.arrayMap.date) {
        date = contribution.arrayMap.date[0];
      }

      if (!date) {
        const currentDate = new Date();
        const currentDay = String(currentDate.getDate()).padStart(2, '0');
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const currentYear = String(currentDate.getFullYear()).slice(-2);
        date = `${currentDay}.${currentMonth}.${currentYear}`;
      }

      const yearMonth = `20${date.split(".")[2]}-${date.split(".")[1].padStart(2, '0')}`;
      const contributors = contribution.contributors;

      // Initialize the yearMonth key if it doesn't already exist
      if (!aggregatedAmountsPerMonth[yearMonth]) {
        aggregatedAmountsPerMonth[yearMonth] = {};
      }

      for (let contributor in contributors) {
        for (let token in contributors[contributor]) {
          // Initialize the token key under the current month-year if it doesn't already exist
          if (!aggregatedAmountsPerMonth[yearMonth][token]) {
            aggregatedAmountsPerMonth[yearMonth][token] = 0;
          }

          // Aggregate the amount
          const tokenAmount = Number(contributors[contributor][token]) || 0;
          aggregatedAmountsPerMonth[yearMonth][token] += tokenAmount;
        }
      }
    });
    return aggregatedAmountsPerMonth;
  }

  async function buildTx(assetsPerAddress: any, adaPerAddress: any, metaData: any) {
    let txHash = ""

    const tx = new Transaction({ initiator: wallet });

    // Get wallet's UTxOs and change address
    const utxos = await wallet.getUtxos();
    const changeAddress = await wallet.getChangeAddress();

    // Add outputs to transaction
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

    // Set change address and select UTxOs
    tx.setChangeAddress(changeAddress);
    tx.setTxInputs(utxos);

    // Set metadata
    tx.setMetadata(674, metaData);

    let unsignedTx = ""
    try {
      // Build the transaction with automatic UTxO selection
      unsignedTx = await tx.build();
      const { txamounts, fee } = getTxAmounts(unsignedTx)
      for (let i in assetsPerAddress) {
        for (let j in assetsPerAddress[i]) {
          for (let k in walletTokens) {
            if (assetsPerAddress[i][j].unit == walletTokens[k].unit) {
              if (txamounts[i][walletTokens[k].name] == undefined) {
                txamounts[i][walletTokens[k].name] = 0
              }
              txamounts[i][walletTokens[k].name] = txamounts[i][walletTokens[k].name] + (parseInt(assetsPerAddress[i][j].quantity) / (10 ** parseInt(walletTokens[k].decimals ? walletTokens[k].decimals : 0)))
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

      let aggregatedAGIXPerMonth = getAggregatedAmounts(metaData);
      let aggregatedAmountsPerMonth = getAggregatedAmountsPerMonth(metaData);

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
      let transactionQuarter = getQuarterFromDate(new Date());
      let subtractFromSpecificQuarter = true;

      if (txdata.project == "Singularity Net Ambassador Wallet" && Number(totalAmounts.AGIX) > 0) {
        for (let yearQuarter in aggregatedAGIXPerMonth) {
          let budgetQuarter = subtractFromSpecificQuarter ? getQuarterFromDate(new Date(yearQuarter)) : transactionQuarter;
          if (!monthly_budget_balance[budgetQuarter]) {
            monthly_budget_balance[budgetQuarter] = {};
          }
          monthly_budget_balance[budgetQuarter]["AGIX"] = (Number(monthly_budget_balance[budgetQuarter]["AGIX"]) || 0) - aggregatedAGIXPerMonth[yearQuarter];
          monthly_budget_balance[budgetQuarter]["AGIX"] = monthly_budget_balance[budgetQuarter]["AGIX"].toFixed(2);
        }
      }

      if (txdata.project === "Test Wallet") {
        for (let yearMonth in aggregatedAmountsPerMonth) {
          if (!monthly_budget_balance[yearMonth]) {
            monthly_budget_balance[yearMonth] = {};
          }
          for (let token in aggregatedAmountsPerMonth[yearMonth]) {
            if (!monthly_budget_balance[yearMonth][token]) {
              monthly_budget_balance[yearMonth][token] = 0;
            }
            monthly_budget_balance[yearMonth][token] = (Number(monthly_budget_balance[yearMonth][token]) - aggregatedAmountsPerMonth[yearMonth][token]).toFixed(2);
          }
        }
      }

      let monthly_budget_balance_strings: any = {}
      for (let month in monthly_budget_balance) {
        monthly_budget_balance_strings[month] = formatTotalAmounts(monthly_budget_balance[month]);
      }

      let d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      const totalAmountsString = formatTotalAmounts(totalAmounts)
      const currentQuarter = getQuarterFromDate(d);
      const currentQuarterBudgetBalance = monthly_budget_balance[currentQuarter];
      const monthly_wallet_budget_string = monthly_budget_balance_strings[d.toISOString().slice(0, 7)] ? monthly_budget_balance_strings[d.toISOString().slice(0, 7)] : formatTotalAmounts(currentQuarterBudgetBalance);
      const currentQuarterBudgetBalanceString = formatTotalAmounts(currentQuarterBudgetBalance);

      txdata = {
        ...txdata,
        monthly_budget_balance,
        monthly_wallet_budget_string,
        currentQuarterBudgetBalanceString,
        totalAmountsString,
      }

      // Sign the transaction
      let signedTx;
      try {
        signedTx = await wallet.signTx(unsignedTx);
        // Only submit if successfully signed
        if (signedTx) {
          txHash = await wallet.submitTx(signedTx);
          txdata = {
            ...txdata,
            txHash: txHash
          }
          return txHash;
        } else {
          throw new Error("Transaction was not signed");
        }
      } catch (error: any) {
        if (error.code === 2) { // User declined to sign
          throw new Error("Transaction signing was declined by user");
        }
        throw error; // Re-throw other errors
      }

    } catch (error) {
      console.error('An error occurred while processing the transaction:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  function getQuarterFromDate(date: any) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    let quarter = "";
    if (month <= 3) quarter = "Q1";
    else if (month <= 6) quarter = "Q2";
    else if (month <= 9) quarter = "Q3";
    else quarter = "Q4";
    return `${year}-${quarter}`;
  }

  async function executeTransaction(assetsPerAddress: any, adaPerAddress: any, metaData: any): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let customFilePath = '';
        let customFileContent = '';
        let txid: string = '';

        // Set loading state before building transaction
        setLoading(true);

        try {
          txid = await buildTx(assetsPerAddress, adaPerAddress, metaData);
        } catch (error: any) {
          if (error.message === "Transaction signing was declined by user") {
            alert("Transaction was declined. Please try again and approve the transaction.");
            setLoading(false);
            return reject(error);
          }
          throw error; // Re-throw other errors to be caught by outer catch
        }

        // Only proceed if we have a valid transaction hash
        if (!txid) {
          throw new Error("Failed to get transaction hash");
        }

        setDoneTxHash(txid);

        const updatedVariable = {
          ...myVariable,
          ...txdata
        };

        setMyVariable(updatedVariable);

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
        router.push(`/done/${txid}`);
      } catch (error) {
        console.error("Error processing transaction:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred");
        reject(error);
      } finally {
        setLoading(false);
      }
    });
  }

  async function getTokenRates(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    // Extract token names from wallettokens
    const tokenNames = wallettokens.map(token => token.name);
    const cachedData = get('rates');

    let tokenExchangeRates: any = {};

    // If we have cachedData and the token names have not changed, use the cached rates
    if (cachedData && JSON.stringify(cachedData.tokens) === JSON.stringify(tokenNames)) {
      tokenExchangeRates = cachedData.data;
      setTokenRates(tokenExchangeRates);
      if (tokenExchangeRates['ADA'] !== undefined) {
        let xrates: any = document.getElementById('xrate');
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
        {!loading && connected && txStatus && (
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
                  onClick={handleSwitchBuilder}
                  transactionBuilderProps={transactionBuilderProps}
                  contributionBuilderProps={contributionBuilderProps}
                  jsonGenTransactionBuilderProps={jsonGenTransactionBuilderProps}
                  tableContributionBuilderProps={contributionBuilderProps} // Add this line
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
                {(activeBuilder === 'manual' || activeBuilder === 'table') && isVisible && (
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

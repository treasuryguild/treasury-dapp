import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import styles from '../../styles/Txid.module.css';
import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { getTxInfo } from '../../utils/getTxInfo';
import { getProject } from '../../utils/getProject'
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { getLabels } from '../../utils/getLabels'
import { updateTxInfo } from '../../utils/updateTxInfo'
import { checkTxStatus } from '../../utils/checkTxStatus'
import { getAssetList } from '../../utils/getassetlist'
import { get, set } from '../../utils/cache'
import { getExchangeRate } from '../../utils/getexchangerate'
import { sendDiscordMessage } from '../../utils/sendDiscordMessage'
import { commitFile } from '../../utils/commitFile'

interface Token {
  id: string;
  name: string;
  displayname: string;
  amount: string;
  unit: string;
  fingerprint: string;
  decimals: number;
  tokenType: string;
}

interface Amounts {
  [tokenName: string]: string | number;
}

interface GetTxInfoResult {
  addressAssets: Record<string, Token[]>;
  transactionType: string;
}


interface AddressAsset {
  tokens: Token[];
  description: string;
  selectedLabels: { value: string; label: string }[];
  userDefinedLabels: string[];
}

let txdata: any = {};
let txtype: any = '';
let txHash: any = '';
let fee: any = '';
let wallet2: any = ''
let projectInfo2: any;
let metadata: any = {};

function Txid() {
  const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}`
  const router = useRouter();
  const { txId } = router.query;
  const { connected, wallet } = useWallet();
  const [txStatus, setTxStatus] = useState<boolean>(false);
  const [message, setMessage] = useState<boolean>(true);
  const [addressAssets, setAddressAssets] = useState<Record<string, AddressAsset>>({});
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [description, setDescription] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [loading, setLoading] = useState<boolean>(false);
  //const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])
  const [labelOptions, setLabelOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: 'Content Creation', label: 'Content Creation' },
    { value: 'Staking', label: 'Staking' },
  ]);

  useEffect(() => {
    const executeAsync = async () => {
      if (connected) {
        await assignTokens();
        //await checkTransactionType();
      }
    };
  
    executeAsync();
  }, [connected]);
  

  useEffect(() => {
    console.log("Changed")
  }, [walletTokens]);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }
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

  const handleInputChange = (address: string, name: string, value: any) => {
    setAddressAssets({
      ...addressAssets,
      [address]: {
        ...addressAssets[address],
        [name]: value,
      },
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    let customFilePath = '';
    let customFileContent = '';
    let folder = ''
    let lastSix = wallet2.slice(-6);
    let filename = ''
    e.preventDefault();
    if (txdata.txtype != "Outgoing") {
      filename = lastSix
      folder = (txdata.txtype).replace(/\s/g, '-')
      for (let i in addressAssets) {
        metadata.contributions[0].label = [`${txdata.txtype}`]
        metadata.contributions[0].description = [`${addressAssets[i].description?addressAssets[i].description:description}`]
      }
    } else {
      filename = `${(txdata.group).replace(/\s/g, '-')}-bulkTransactions`
      folder = "bulkTransactions"
      metadata.contributions[0].label = []
      metadata.contributions[0].description = []
      for (let i in addressAssets) {
        metadata.contributions[0].description.push(addressAssets[i].description)
        for (let j in addressAssets[i].selectedLabels) {
          metadata.contributions[0].label.push(addressAssets[i].selectedLabels[j].value)
        }
      }
    }
    
    let newMetaData = metadata
    newMetaData['txid'] = txId
    customFileContent = `${JSON.stringify(newMetaData, null, 2)}`;
    let pType = ''
    if (txdata.project_type == 'Treasury Wallet') {
      pType = 'TreasuryWallet'
    } else {
      let prepType = txdata.project_type.replace(/\s/g, '')
      pType = prepType.replace("Proposal", '')
    }
    setLoading(true);
    txdata.send_message = message;
    customFilePath = `Transactions/${(txdata.group).replace(/\s/g, '-')}/${pType}/${(txdata.project).replace(/\s/g, '-')}/${folder}/${new Date().getTime().toString()}-${filename}.json`;
    await updateTxInfo(txdata, newMetaData, txId, customFilePath)
    //await commitFile(customFilePath, customFileContent)
    //await sendDiscordMessage(txdata);
    //console.log("Final values",txdata, newMetaData, customFilePath, addressAssets);
    setTimeout(() => router.push(`/txbuilder/`), 3000);
  };

  function formatWalletBalance(walletBalanceAfterTx: Token[]): string {
    const formattedBalances = walletBalanceAfterTx
      .map((item: Token) => {
        if (item.tokenType) {
          if (item.tokenType == "fungible") {
            return `* ${parseFloat(item.amount).toFixed(2)} ${item.name}\n`;
          }
        }
      })
      .filter(Boolean);
    return formattedBalances.join('');
}


  

  function formatTotalAmounts(totalAmounts: any): string {
    let totalAmountsString = '';
    for (let token in totalAmounts) {
      const walletToken = txdata.walletTokens.find((t: any) => t.name === token);
      
      // Check if walletToken and walletToken.tokenType are defined
      if (walletToken && walletToken.tokenType) {
        if (walletToken.tokenType === 'fungible') {
          totalAmountsString += `* ${totalAmounts[token]} ${token}\n`;
        } else {
          totalAmountsString += `* ${totalAmounts[token]} ${walletToken.displayname}\n`;
        }
      }
      else {
        continue;
      }
    }
    
    /*Object.entries(totalAmounts).forEach(([key, value]) => {
      totalAmountsString += `* ${value} ${key}\n`;
    });*/
    //console.log("totalAmountsString", totalAmountsString)
    return totalAmountsString;
  }

  function formatAmounts(amounts: any, rates: any) {
    let output = [];
    
    for (let key in amounts) {
        let amount = amounts[key];
        let rate = rates[key] || 0;

        // For tokens other than ADA, format them to 2 decimal places
        if (key !== 'ADA') {
            amount = parseFloat(amount).toFixed(2);
        }

        // Convert token amount to USD
        let usdAmount = parseFloat(amount) * parseFloat(rate);

        output.push(`${usdAmount.toFixed(2)} USD in ${amount} ${key}`);
    }

    return output;
}

  async function getMetaData() {
    let keys = Object.keys(txdata.txamounts); 
    let lastSix = wallet2.slice(-6);
    let contributor: any = {}
    let metaDescription = '';
    let label = ''
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (txdata.txtype == "Incoming") {
          contributor[lastSix] = txdata.txamounts[key];
          metaDescription = `Incoming rewards from ${projectInfo2.project?projectInfo2.project:lastSix}`
          setDescription(metaDescription)
          label = txdata.txtype
        } else {
          contributor[key.slice(-6)] = txdata.txamounts[key];
          metaDescription = `Rewards to ${keys.length} contributors`
          setDescription(metaDescription)
          if (txdata.txtype == "Staking") {
            label = txdata.txtype
            metaDescription = 'Staking to Pool'
            setDescription(metaDescription)
          } else if (txdata.txtype == "Rewards Withdrawal") {
            label = txdata.txtype
            metaDescription = 'Rewards Withdrawal'
            setDescription(metaDescription)
          } else if (txdata.txtype == "Internal Transfer") {
            label = txdata.txtype
            metaDescription = 'Internal Transfer'
            setDescription(metaDescription)
          } else if (txdata.txtype == "Minting") {
            label = txdata.txtype
            metaDescription = 'Minted new tokens'
            setDescription(metaDescription)
          }
        }
    }

    let textContributor = JSON.stringify(contributor)
    let metaData = `{
      "mdVersion": ["1.4"],
      "txid": "${txId}",
      "msg": [
      "${txdata.project} Transaction",
      "Website: ${txdata.project_website}",
      "Recipients: 1",
      "Transaction made by Treasury Guild @${txdata.tokenRates['ADA']}",
      "https://www.treasuryguild.io/"
      ],
      "contributions": [
        {
          "taskCreator": ["${txdata.project}"],
          "label": ["${label}"],
          "description": [
            "${metaDescription}"
          ],
          "contributors": ${textContributor}
        }
      ]
      }
      `
      let finalMetaData: any = {}
      finalMetaData = JSON.parse(metaData)
      finalMetaData.msg.splice(3, 0, ...formatAmounts(txdata.totalAmounts, txdata.tokenRates));
      return finalMetaData;
  }

  interface Contribution1 {
    taskCreator: string;
    label: string;
    name?: string[];
    description?: string[]; // description might be undefined
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
  
  async function checkTransactionType() {
    if (connected) { 
      const databaseLabels = await getLabels();
      const output: OutputLabels[] = transformArrayToObject(databaseLabels);
      //console.log(databaseLabels, output)
      setLabelOptions(output);
      const usedAddresses = await wallet.getUsedAddresses();
      const assets = await wallet.getAssets();
      const txData = await txInfo();
      const result = await getTxInfo(usedAddresses, txData[0], assets) as GetTxInfoResult;
      fee = parseInt(txData[0].fee)
      let txamounts: Record<string, Amounts> = {};
      wallet2 = txData[0].inputs[0].payment_addr.bech32
      if (result.transactionType == "Incoming") {
        projectInfo2 = await getProject(wallet2);
        txdata = {...txdata,
          wallet: wallet2,
          incomingwallet: usedAddresses[0]}
      }
      
      let date = new Date(txData[0].tx_timestamp*1000);
      let originalDateString = date.toISOString();
      const originalDate = new Date(originalDateString);
      const year = originalDate.getUTCFullYear();
      const month = String(originalDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(originalDate.getUTCDate()).padStart(2, '0');
      const hours = String(originalDate.getUTCHours()).padStart(2, '0');
      const minutes = String(originalDate.getUTCMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes} UTC`;
      
      txHash = txId
      txtype = result.transactionType
      txdata = {...txdata, fee, formattedDate, txHash, txtype};

      for (let address in result.addressAssets) {
        result.addressAssets[address].forEach((token: Token) => {
          for (let k in txdata.walletTokens) {
            if (txdata.walletTokens[k].fingerprint === token.fingerprint) {
              token.name = txdata.walletTokens[k].name;
            }
          }
        });
      }
      setAddressAssets(
        Object.fromEntries(
          Object.entries(result.addressAssets).map(([address, tokens]: [string, Token[]]) => [
            address,
            {
              tokens,
              description: '',
              selectedLabels: [],
              userDefinedLabels: [],
            },
          ])
        )
      );
      for(let address in result.addressAssets) {
        let array: Token[] = result.addressAssets[address];
        
        txamounts[address] = array.reduce((obj: Amounts, item: Token) => {
          obj[item.name] = parseFloat(item.amount);
          return obj;
        }, {});
      }
      txdata = {...txdata, txamounts}
      metadata = await getMetaData()
      const txdescription = processMetadata(metadata)
      let totalAmounts: any = {};
          for (let i in txamounts) {
            for (let j in txamounts[i]) {
              if (totalAmounts[j] === undefined) {
                totalAmounts[j] = 0;
              }
              totalAmounts[j] += txamounts[i][j];
            }
          }
      totalAmounts.ADA = parseFloat(totalAmounts.ADA.toFixed(6));
      const totalAmountsString = formatTotalAmounts(totalAmounts);

      let monthly_budget_balance: any = JSON.parse(JSON.stringify(txdata.monthly_budget));
      let d = new Date();
      
      if (txdata.project == "Singularity Net Ambassador Wallet") {
          let currentDate = d.getDate();
          let totalDaysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          // If current date is 10 days before the end of the month
          if ((currentDate >= totalDaysInMonth - 10) && (Number(totalAmounts.AGIX) > 10000)) {
            d.setMonth(d.getMonth() + 2, 1); // Set to next month if within 10 days of end of month and AGIX > 10K
          } else {
            d.setMonth(d.getMonth() + 1, 1); // Otherwise, set to current month
          }
          d.setHours(0, 0, 0, 0); // Reset time portion to avoid timezone and daylight saving time issues
      
          if (!monthly_budget_balance) {
              monthly_budget_balance = {}
          }
      
          let budget_month = d.toISOString().slice(0, 7);
          txdata.budget_month = budget_month;
      
          if (!monthly_budget_balance[budget_month]) {
              monthly_budget_balance[budget_month] = {}
          }
          
          if (txdata.txtype == "Incoming" && Number(totalAmounts.AGIX) > 10000) {
              monthly_budget_balance[budget_month]["AGIX"] = Number(totalAmounts.AGIX);
          } else if (txdata.txtype != "Incoming" && Number(totalAmounts.AGIX) > 0) {
              monthly_budget_balance[budget_month]["AGIX"] = (Number(txdata.monthly_budget[budget_month]["AGIX"]) || 0) - Number(totalAmounts.AGIX);
          }
          monthly_budget_balance[budget_month]["AGIX"] = typeof monthly_budget_balance[budget_month]["AGIX"] === 'number' ? monthly_budget_balance[budget_month]["AGIX"].toFixed(2) : parseFloat(monthly_budget_balance[budget_month]["AGIX"] as string).toFixed(2);
      }
      
      if (txdata.project == "Test Wallet") {
        d.setMonth(d.getMonth() + 1, 1); // Set the day to 1 to avoid end of month discrepancies
        d.setHours(0, 0, 0, 0); // Reset time portion to avoid timezone and daylight saving time issues
        txdata.budget_month = d.toISOString().slice(0, 7)
        for (let token in totalAmounts) {
            const walletToken = txdata.walletTokens.find((t: any) => t.name === token);
            if (walletToken && walletToken.tokenType === 'fungible' && totalAmounts[token] > 0) {
                if (!monthly_budget_balance) {
                    monthly_budget_balance = {}
                }
                if (!monthly_budget_balance[txdata.budget_month]) {
                    let lastMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
                    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
                    let lastMonthKey = lastMonth.toISOString().slice(0, 7);
                    //console.log("lastMonthKey", lastMonthKey)
                    if (monthly_budget_balance[lastMonthKey]) {
                        monthly_budget_balance[txdata.budget_month] = JSON.parse(JSON.stringify(monthly_budget_balance[lastMonthKey]));
                        txdata.monthly_budget[txdata.budget_month] = JSON.parse(JSON.stringify(monthly_budget_balance[lastMonthKey]));
                    } else {
                        monthly_budget_balance[txdata.budget_month] = {};
                    }
                }
                //console.log("monthly_budget_balance", monthly_budget_balance)
                if (txdata.txtype == "Incoming") {
                    monthly_budget_balance[txdata.budget_month][token] = (Number(txdata.monthly_budget[txdata.budget_month][token]) || 0) + Number(totalAmounts[token]);
                } else if (txdata.txtype != "Incoming") {
                    monthly_budget_balance[txdata.budget_month][token] = (Number(txdata.monthly_budget[txdata.budget_month][token]) || 0) - Number(totalAmounts[token]);
                }
                monthly_budget_balance[txdata.budget_month][token] = typeof monthly_budget_balance[txdata.budget_month][token] === 'number' ? monthly_budget_balance[txdata.budget_month][token].toFixed(2) : parseFloat(monthly_budget_balance[txdata.budget_month][token] as string).toFixed(2);
            }
        }
      }
      
      let monthly_budget_balance_strings: any = {};
      
      // Create a formatted string for each month's budget balance
      for (let month in monthly_budget_balance) {
          monthly_budget_balance_strings[month] = formatTotalAmounts(monthly_budget_balance[month]);
      }
      
      const monthly_wallet_budget_string = monthly_budget_balance_strings[d.toISOString().slice(0, 7)];
    

      txdata = {...txdata, txdescription, totalAmounts, totalAmountsString, monthly_budget_balance, monthly_wallet_budget_string}
    }
    //console.log("txdata", txdata)
    setLoading(false);
  }  
  
  async function assignTokens() {
    setLoading(true);
    setTokenRates({})
    setDescription('')
    const usedAddresses = await wallet.getUsedAddresses();
    
    let transactionStatus: any = false;
    
    //Loop to keep checking the transaction status every 30 seconds
    while (transactionStatus == false) {
        transactionStatus = await checkTxStatus(usedAddresses[0], txId);
        if (!transactionStatus) {
            //Wait for 20 seconds
            await new Promise(resolve => setTimeout(resolve, 20000));
        } else {
            break;
        }
    }
    setTxStatus(transactionStatus);
    
    let projectInfo: any;
    projectInfo = await getProject(usedAddresses[0]);
    if (Object.keys(projectInfo).length === 0) {
        router.push('/newwallet')
    }
    txdata = {...txdata,
      ...projectInfo,
      wallet: usedAddresses[0],}
      
    let assetList = await getAssetList(usedAddresses[0]);
    setWalletTokens(assetList);
    //console.log("getAssetList", assetList)
    if (projectInfo.project != undefined) {
        await getTokenRates(assetList);
    }
    const balanceString = formatWalletBalance(assetList)
    txdata = {...txdata,
      walletTokens: assetList,
      balanceString,
      walletBalanceAfterTx: assetList}
      await checkTransactionType();
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
    txdata = {...txdata,
      tokenRates: tokenExchangeRates}
    //console.log("tokenrates", tokenExchangeRates, wallettokens);
  }  

  async function txInfo() {
    const url = "https://api.koios.rest/api/v0/tx_info";
    const data = {
      _tx_hashes: [txId],
    };

    const response = await axios.post(url, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    //console.log(response.data)
    return response.data;
  }

  const handleSendMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.checked);
  };
  
  return (
    <div className={styles.body}>
      {loading && txStatus && (
        <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>Loading...</div>
            </div>
        </div>
      )}
      {connected && !txStatus && (
        <div className={styles.body}>
            <div className={styles.form}>
              <div className={styles.loading}>Tx still pending</div>
            </div>
        </div>
      )}
      {!loading && txStatus && (
        <form className={styles.form} onSubmit={handleSubmit}>
        {Object.entries(addressAssets).map(([address, data], index) => (
          <div  className={styles.address} key={address}>
            <h3>Address: ...{address.slice(-6)}</h3>
            {data.tokens.map((token, tokenIndex) => (
              <p key={tokenIndex}>
                {token.name}: {token.amount}
              </p>
            ))}
            {txdata.txtype == "Incoming" && (<div>Incoming</div>)}
            {txdata.txtype == "Minting" && (<div>Minting</div>)}
            {txdata.txtype == "Staking" && (<div>Staking</div>)}
            {txdata.txtype == "Internal Transfer" && (<div>Internal Transfer</div>)}
            {txdata.txtype == "Rewards Withdrawal" && (<div>Rewards Withdrawal</div>)}
            {txdata.txtype == "Outgoing" && (
            <div className={styles.labels}>
              <CreatableSelect
                isMulti
                options={[...labelOptions]}
                value={data.selectedLabels}
                onChange={(selected) => {
                  handleInputChange(address, 'selectedLabels', selected || []);
                }}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? 'grey' : 'white',
                    backgroundColor: 'black',
                    color: 'white',
                  }),
                  option: (baseStyles, { isFocused, isSelected }) => ({
                    ...baseStyles,
                    backgroundColor: isSelected ? 'darkblue' : isFocused ? 'darkgray' : 'black',
                    color: 'white',
                  }),
                  multiValue: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: 'darkblue',
                  }),
                  multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: 'white',
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: 'white',
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: 'black',
                  }),
                }}
              />
            </div>
            )}
            <div className={styles.description}>
              <label>Description:</label>
              <textarea
                name="description"
                defaultValue={description}
                onChange={(e) => handleInputChange(address, 'description', e.target.value)}
              />
            </div>
            <div>
              <label>Send Discord Message:</label>
              <input
                type="checkbox"
                checked={message}
                onChange={handleSendMessageChange}
              />
            </div>
          </div>
        ))}
        {connected && (
          <button className={styles.update} type="submit">Update</button>
        )}
      </form>
      )}
      {
        <div className={styles.description}>
        <label>Exchange Rate</label>
          <input
            type="text"
            id="xrate"
            name="xrate"
            autoComplete="off"
            required
          />
        </div> 
        }
    </div>
    
  );
}

export default Txid;

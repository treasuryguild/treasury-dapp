import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { getTxInfo } from '../../utils/getTxInfo';
import { getProject } from '../../utils/getProject'
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { updateTxInfo } from '../../utils/updateTxInfo'
import { sendDiscordMessage } from '../../utils/sendDiscordMessage'
import { commitFile } from '../../utils/commitFile'

interface Token {
  id: string;
  name: string;
  amount: string;
  unit: string;
  fingerprint: string;
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
  const [addressAssets, setAddressAssets] = useState<Record<string, AddressAsset>>({});
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [description, setDescription] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])
  const [labelOptions, setLabelOptions] = useState<{ value: string; label: string }[]>([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: 'Content Creation', label: 'Content Creation' },
    { value: 'Staking', label: 'Staking' },
  ]);

  useEffect(() => {
    if (connected) {
      assignTokens()
      checkTransactionType();
    }
  }, [connected]);

  useEffect(() => {
    console.log("Changed", walletTokens)
  }, [walletTokens]);

  if (router.isFallback) {
    return <div>Loading...</div>;
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
    }
    
    customFilePath = `Transactions/${(txdata.group).replace(/\s/g, '-')}/${pType}/${(txdata.project).replace(/\s/g, '-')}/${folder}/${new Date().getTime().toString()}-${filename}.json`;
    await updateTxInfo(txdata, newMetaData, txId, customFilePath)
    //await commitFile(customFilePath, customFileContent)
    //await sendDiscordMessage(txdata);
    console.log("Final values",txdata, newMetaData, customFilePath);
    router.push(`/transactions/`)
  };

  function formatWalletBalance(walletBalanceAfterTx: Token[]): string {
    const formattedBalances = walletBalanceAfterTx.map((item: Token) => {
        return `${parseFloat(item.amount).toFixed(2)} ${item.name}`;
    });
  
    return formattedBalances.join(' ');
  }
  

  function formatTotalAmounts(totalAmounts: any): string {
    let totalAmountsString = '';
    Object.entries(totalAmounts).forEach(([key, value]) => {
      totalAmountsString += `* ${value} ${key}\n`;
    });
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
          }
        }
    }

    let textContributor = JSON.stringify(contributor)
    console.log("View msg amounts",lastSix, formatAmounts(txdata.totalAmounts, txdata.tokenRates), contributor)
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
          "taskCreator": "${txdata.project}",
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
      const usedAddresses = await wallet.getUsedAddresses();
      const assets = await wallet.getAssets();
      const txData = await txInfo();
      const result = await getTxInfo(usedAddresses, txData[0], assets) as GetTxInfoResult;
      console.log("txData",txData)
      fee = parseInt(txData[0].fee)
      let txamounts: Record<string, Amounts> = {};
      wallet2 = txData[0].inputs[0].payment_addr.bech32
      if (result.transactionType == "Incoming") {
        projectInfo2 = await getProject(wallet2);
        txdata = {...txdata,
          wallet: wallet2,
          incomingwallet: usedAddresses[0]}
      }
      for(let address in result.addressAssets) {
        let array: Token[] = result.addressAssets[address];
        
        txamounts[address] = array.reduce((obj: Amounts, item: Token) => {
          obj[item.name] = parseFloat(item.amount);
          return obj;
        }, {});
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
      console.log("txData", txData )
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
      const totalAmountsString = formatTotalAmounts(totalAmounts)
      txHash = txId
      txtype = result.transactionType
      txdata = {...txdata, txamounts, fee, formattedDate, txHash, txtype, totalAmounts, totalAmountsString};
    
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
    }
  }  
  
  async function assignTokens() {
    setDescription('')
    const usedAddresses = await wallet.getUsedAddresses();
    let projectInfo: any;
    projectInfo = await getProject(usedAddresses[0]);
    console.log("projectInfo",projectInfo)
    if (Object.keys(projectInfo).length === 0) {
      router.push('/newwallet')
    }
    txdata = {...txdata,
      ...projectInfo,
      wallet: usedAddresses[0],}
    let tokenNames: string[] = []
    let tokenFingerprint: any[] = []
    let tokenAmounts: any[] = []
    let finalTokenAmount = 0
    let tokenUnits: any[] = []
    let tickerDetails = await axios.get(tickerAPI);
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
        if (asset.fingerprint === tickerDetails.data.tickerFingerprints[asset.assetName]) {
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
    if (projectInfo.project != undefined) {
      tokens = await getAssetDetails(tokens);
      await getEchangeRate(tokens);
    }
    const balanceString = formatWalletBalance(tokens)
    metadata = await getMetaData()
    const txdescription = processMetadata(metadata)
    txdata = {...txdata,
      walletTokens: tokens,
      balanceString,
      txdescription,
      walletBalanceAfterTx: tokens}
    console.log("txdata", txdata, addressAssets, metadata)
  }

  async function getAssetDetails(tokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let updatedTokens = tokens
    const usedAddresses = await wallet.getUsedAddresses();
    try {
      await axios.get(`https://pool.pm/wallet/${usedAddresses[0]}`).then(response => {
        for (let i in response.data.tokens) {
          if (response.data.tokens[i].quantity > 1) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tokens[i].fingerprint) {
                updatedTokens[j]['name'] = response.data.tokens[i].metadata.ticker?response.data.tokens[i].metadata.ticker:response.data.tokens[i].metadata.symbol
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tokens[i].metadata.decimals?response.data.tokens[i].metadata.decimals:0;
                updatedTokens[j]['amount'] = (parseFloat(updatedTokens[j]['amount'])/10**updatedTokens[j]['decimals']).toFixed(updatedTokens[j]['decimals'])
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
        for (let i in response.data.tickerApiNames) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tickerFingerprints[i]) {
                updatedTokens[j]['name'] = i;
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i]?response.data.tickerDecimals[i]:0;
                updatedTokens[j]['amount'] = (parseFloat(updatedTokens[j]['amount'])/10**updatedTokens[j]['decimals']).toFixed(updatedTokens[j]['decimals'])
              }
            }
        }
        });
      // handle the error as appropriate
    }
    setWalletTokens(updatedTokens);
    return updatedTokens
  }

  async function getEchangeRate(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let tickerDetails = await axios.get(tickerAPI)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates: any = {}
    console.log("tokens inside exchange", wallettokens)
    for (let i in wallettokens) {
      try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`)
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        if (rate !== undefined) {
          tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
        } else {
          tokenExchangeRates[wallettokens[i].name] = 0.00
        }
      } catch (error) {
        //console.log(`Failed to get exchange rate for ${wallettokens[i].name}: `, error);
        tokenExchangeRates[wallettokens[i].name] = 0.00
      }
    }
    setTokenRates(tokenExchangeRates)
    txdata = {...txdata,
      tokenRates: tokenExchangeRates}
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

    return response.data;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(addressAssets).map(([address, data], index) => (
        <div key={address}>
          <h3>Address: ...{address.slice(-6)}</h3>
          {data.tokens.map((token, tokenIndex) => (
            <p key={tokenIndex}>
              {token.name}: {token.amount}
            </p>
          ))}
          {txdata.txtype == "Incoming" && (<div>Incoming</div>)}
          {txdata.txtype == "Staking" && (<div>Staking</div>)}
          {txdata.txtype == "Rewards Withdrawal" && (<div>Rewards Withdrawal</div>)}
          {txdata.txtype == "Outgoing" && (
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
          )}
          <label>
            Description:
            <textarea
              name="description"
              defaultValue={description}
              onChange={(e) => handleInputChange(address, 'description', e.target.value)}
            />
          </label>
        </div>
      ))}
      <button type="submit">Update</button>
    </form>
  );
}

export default Txid;

import { supabase } from "../lib/supabaseClient";
import axios from 'axios'
import { getProject } from '../utils/getProject'

interface Transaction {
  id: string;
  total_tokens?: string[];
  total_amounts?: number[];
}
type DataType = { wallet: string }[] | null;
type MyVariableType = { 
    txamounts: Record<string, { [key: string]: number }>,
    walletBalanceAfterTx: any,
    totalAmounts: any,
    tokenRates: any,
    fee: any,
    txtype: any,
    project_id: any,
    group: any
};

let customFilePath = 'test path'
let projectInfo:any = []
let newMyVariable: any = []

export async function checkAndUpdate(myVariable:any, thash: any) {
    newMyVariable = {...myVariable};
    async function checkAddress(myVariable: MyVariableType) {
      const { data, error } = await supabase
        .from("projects")
        .select("wallet");
        
      console.log("checking", myVariable, thash);  // Removed undefined variables
  
      if (data && !["Incoming", "Staking", "Rewards Withdrawal"].includes(myVariable.txtype)) {
        const matchingWallets: DataType = Object.keys(myVariable.txamounts)
          .map((key) => data.find((d) => d.wallet === key))
          .filter((wallet): wallet is { wallet: string } => Boolean(wallet));
        console.log("Matching wallets: ", matchingWallets);
  
        // Run updateVar only if there are matching wallets
        if (matchingWallets.length > 0) {
          let wallet = '';
          for (let i in matchingWallets) {
              wallet =  matchingWallets[i].wallet;
          }
          await updateVar(wallet);
        }
      }
  }
  
    async function updateVar(wallet: any) {
        let projectInfo: any
        projectInfo = await getProject(wallet);
        newMyVariable = {...newMyVariable,...projectInfo}
        let incomingWallet = myVariable.wallet
        newMyVariable.txtype = "Incoming"
        newMyVariable.wallet = wallet
        newMyVariable.incomingwallet = wallet
        newMyVariable.txamounts = {}
        newMyVariable.txamounts[incomingWallet] = myVariable.txamounts[wallet]
        let totalAmounts: any = {};
          for (let i in newMyVariable.txamounts) {
            for (let j in newMyVariable.txamounts[i]) {
              if (totalAmounts[j] === undefined) {
                totalAmounts[j] = 0;
              }
              totalAmounts[j] += newMyVariable.txamounts[i][j];
            }
          }
        newMyVariable.totalAmounts = totalAmounts
        await getBalance(wallet)
        console.log("wallet",wallet, newMyVariable, myVariable, projectInfo)
    }
  async function getBalance(wallet: any) {
    let customFilePath = '';
    let customFileContent = '';
    let pType = ''
            if (myVariable.project_type == 'Treasury Wallet') {
              pType = 'TreasuryWallet'
            }
    await axios.get(`https://pool.pm/wallet/${wallet}`).then(response => {
        console.log("poolpm",response.data)
        const outputArray = convertObject(response.data);
        console.log(outputArray);
        newMyVariable.walletBalanceAfterTx = outputArray
        const newwalletBal = updateWalletBalanceAfterTx(newMyVariable.walletBalanceAfterTx,newMyVariable.totalAmounts,newMyVariable.walletTokens)
        console.log("newwalletBal", newwalletBal)
        newMyVariable.walletTokens = []
        const balanceString = formatWalletBalance(newMyVariable.walletBalanceAfterTx)
        const totalAmountsString = formatTotalAmounts(newMyVariable.totalAmounts)
        newMyVariable.balanceString = balanceString
        newMyVariable.totalAmountsString = totalAmountsString
        newMyVariable.txdescription = `Incoming rewards from ${myVariable.project}`
        newMyVariable.txHash = thash;
    });
    let keys = Object.keys(newMyVariable.txamounts); 
    let key = keys[0];
    let lastSix = key.slice(-6);
    let metadata = await getMetaData()
    customFileContent = `${JSON.stringify(metadata, null, 2)}`;
    customFilePath = `Transactions/${(newMyVariable.group).replace(/\s/g, '-')}/${pType}/${(newMyVariable.project).replace(/\s/g, '-')}/Incoming/${new Date().getTime().toString()}-${lastSix}.json`;
    await updateTransactionInfo(newMyVariable, metadata, thash, customFilePath)
    console.log("metadata",metadata);
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
    let keys = Object.keys(newMyVariable.txamounts); // Get all keys from the object
    let key = keys[0];
    let lastSix = key.slice(-6);
    let contributor: any = {}
    contributor[lastSix] = newMyVariable.totalAmounts
    let textContributor = JSON.stringify(contributor)

    console.log("View msg amounts",lastSix, formatAmounts(newMyVariable.totalAmounts, newMyVariable.tokenRates), contributor)
    let metaData = `{
      "mdVersion": ["1.4"],
      "txid": "${thash}",
      "msg": [
      "${newMyVariable.project} Transaction",
      "Website: ${newMyVariable.project_website}",
      "Recipients: 1",
      "Transaction made by Treasury Guild @${newMyVariable.tokenRates['ADA']}",
      "https://www.treasuryguild.io/"
      ],
      "contributions": [
        {
          "taskCreator": "${newMyVariable.project}",
          "label": "Incoming",
          "description": [
            "Incoming rewards from ${myVariable.project}"
          ],
          "contributors": ${textContributor}
        }
      ]
      }
      `
      let finalMetaData: any = {}
      finalMetaData = JSON.parse(metaData)
      finalMetaData.msg.splice(3, 0, ...formatAmounts(newMyVariable.totalAmounts, newMyVariable.tokenRates));
      return finalMetaData;
  }
  interface Token {
    id: string;
    name: string;
    amount: string;
    unit: string;
    decimals: number;
    fingerprint?: string;
}

function updateWalletBalanceAfterTx(
  walletBalanceAfterTx: Token[], 
  totalAmounts: { [key: string]: number }, 
  walletTokens: Token[]
): Token[] {
  // Filter walletTokens to only include tokens that are in totalAmounts
  walletTokens = walletTokens.filter(token => totalAmounts.hasOwnProperty(token.name));

  // Iterate over the keys of totalAmounts
  for (let key in totalAmounts) {
      // Try to find the token in walletBalanceAfterTx
      let tokenIndex = walletBalanceAfterTx.findIndex(token => token.name === key);

      if (tokenIndex !== -1) {
          // If the token is found, add the value from totalAmounts to the amount of the token
          let updatedAmount = parseFloat(walletBalanceAfterTx[tokenIndex].amount) // + totalAmounts[key]; //testing speed problem
          // If the token is ADA, format it with 6 decimal places
          walletBalanceAfterTx[tokenIndex].amount = key === 'ADA' ? updatedAmount.toFixed(6) : updatedAmount.toString();
      } else {
          // If the token is not found, find the token in walletTokens
          let walletTokenIndex = walletTokens.findIndex(token => token.name === key);

          if (walletTokenIndex !== -1) {
              // Create a new token object based on the walletTokens info and the amount from totalAmounts
              let newToken: Token = { ...walletTokens[walletTokenIndex], amount: key === 'ADA' ? totalAmounts[key].toFixed(6) : totalAmounts[key].toString() };

              // Add the new token to walletBalanceAfterTx
              walletBalanceAfterTx.push(newToken);
          }
      }
  }

  return walletBalanceAfterTx;
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

function convertObject(inputObj: any) {
  const outputArray = [];

  // Extract ADA balance and add to output
  const adaBalance = {
      id: '1',
      name: 'ADA',
      amount: (inputObj.lovelaces / Math.pow(10, 6)).toFixed(6), // Convert lovelaces to ADA
      unit: 'lovelace',
      decimals: 6,
  };
  outputArray.push(adaBalance);

  // Iterate over each token in inputObj.tokens
  for (let i = 0; i < inputObj.tokens.length; i++) {
      const token = inputObj.tokens[i];
      if (token.minted_quantity > 1) {
          const decimals = token.metadata.decimals || 0;
          const newToken = {
              id: (i+2).toString(), // Increase id by 2 because '1' is used by ADA
              name: token.metadata.ticker?token.metadata.ticker:token.metadata.symbol,
              amount: (token.quantity / Math.pow(10, decimals)).toFixed(decimals), // Divide by 10**decimals and format to 'decimals' decimal places
              unit: token.policy,
              decimals: decimals,
              fingerprint: token.fingerprint,
          };
          outputArray.push(newToken);
      }
  }

  return outputArray;
}

  async function updateTransactionInfo(newMyVariable:any, metaData:any, thash: any, customFilePath: any) {
    const { data: insertResult, error } = await supabase
    .from("transactioninfo")
    .insert([
        { 
            txinfo: newMyVariable, 
            txhash: thash,
            txfilepath: customFilePath, 
            metadata: metaData,
        }
    ])
    .select(`id`)
    .single();;

    if (error) throw error;
    const data = insertResult as unknown as Transaction;

    const id: string | null = data && data.id ? data.id : null;

    return { id };
  }

  await checkAddress(myVariable);
  
}

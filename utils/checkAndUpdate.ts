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

export async function checkAndUpdate(myVariable:any, metaData:any, thash: any) {
    newMyVariable = {...myVariable};
    async function checkAddress(myVariable: MyVariableType) {
        const { data, error } = await supabase
          .from("projects")
          .select("wallet");
          
        console.log("checking", myVariable, metaData, thash, customFilePath);
      
        if (data) {
          const matchingWallets: DataType = Object.keys(myVariable.txamounts)
            .map((key) => data.find((d) => d.wallet === key))
            .filter((wallet): wallet is { wallet: string } => Boolean(wallet));
          console.log("Matching wallets: ", matchingWallets);
          let wallet = ''
        for (let i in matchingWallets) {
            wallet =  matchingWallets[i].wallet
        }
          await updateVar(wallet)
        }
      }
    async function updateVar(wallet: any) {
        let projectInfo: any
        projectInfo = await getProject(wallet);
        newMyVariable = {...newMyVariable,...projectInfo}
        let incomingWallet = myVariable.wallet
        newMyVariable.txtype = "Incoming"
        newMyVariable.wallet = wallet
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
    await axios.get(`https://pool.pm/wallet/${wallet}`).then(response => {
        console.log("poolpm",response.data)
        const outputArray = convertObject(response.data);
        console.log(outputArray);
        newMyVariable.walletBalanceAfterTx = outputArray
        const newwalletBal = updateWalletBalanceAfterTx(newMyVariable.walletBalanceAfterTx,newMyVariable.totalAmounts,newMyVariable.walletTokens)
        console.log("newwalletBal", newwalletBal)
    });
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
            walletBalanceAfterTx[tokenIndex].amount = (parseFloat(walletBalanceAfterTx[tokenIndex].amount) + totalAmounts[key]).toString();
        } else {
            // If the token is not found, find the token in walletTokens
            let walletTokenIndex = walletTokens.findIndex(token => token.name === key);

            if (walletTokenIndex !== -1) {
                // Create a new token object based on the walletTokens info and the amount from totalAmounts
                let newToken: Token = { ...walletTokens[walletTokenIndex], amount: totalAmounts[key].toString() };

                // Add the new token to walletBalanceAfterTx
                walletBalanceAfterTx.push(newToken);
            }
        }
    }

    return walletBalanceAfterTx;
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
                amount: (token.quantity / Math.pow(10, decimals)).toString(), // Divide by 10**decimals
                unit: token.policy,
                decimals: decimals,
                fingerprint: token.fingerprint,
            };
            outputArray.push(newToken);
        }
    }

    return outputArray;
}
  async function updateTransactionInfo(myVariable:any, metaData:any, thash: any, customFilePath: any) {
    const { data: insertResult, error } = await supabase
    .from("transactioninfo")
    .insert([
        { 
            txinfo: myVariable, 
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

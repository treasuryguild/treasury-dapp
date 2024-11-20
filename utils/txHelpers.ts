// txHelpers.ts

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

export function formatWalletBalance(walletBalanceAfterTx: Token[]): string {
  const formattedBalances = walletBalanceAfterTx
    .map((item: Token) => {
      if (item.tokenType && item.tokenType == "fungible") {
        return `* ${parseFloat(item.amount).toFixed(2)} ${item.name}\n`;
      }
    })
    .filter(Boolean);
  return formattedBalances.join('');
}

export function formatTotalAmounts(totalAmounts: any, walletTokens: Token[]): string {
  let totalAmountsString = '';
  for (let token in totalAmounts) {
    const walletToken = walletTokens.find((t: Token) => t.name === token);
    
    if (walletToken && walletToken.tokenType) {
      if (walletToken.tokenType === 'fungible') {
        totalAmountsString += `* ${totalAmounts[token]} ${token}\n`;
      } else {
        totalAmountsString += `* ${totalAmounts[token]} ${walletToken.displayname}\n`;
      }
    }
  }
  return totalAmountsString;
}

export function formatAmounts(amounts: any, rates: any) {
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

export function updateTransactionMessage(obj: any, amount: any) {
  const newObj = { ...obj };
  const messageIndex = newObj.msg.findIndex((message: any) => message.includes("Transaction made by Treasury Guild"));
  if (messageIndex !== -1) {
    newObj.msg[messageIndex] = `Transaction made by Treasury Guild @${amount}`;
  }
  return newObj;
}

export function processMetadata(metadata: any): string {
  if (metadata.contributions.length === 1) {
    const contribution = metadata.contributions[0];
    if (contribution.name && contribution.name.length > 0) {
      return contribution.name.join(' ');
    } else if (contribution.description && contribution.description.length > 0) {
      return contribution.description.join(' ');
    }
  } else {
    const recipientsMsg = metadata.msg.find((msg: string) => msg.startsWith("Recipients: "));
    if (recipientsMsg) {
      const numberOfRecipients = recipientsMsg.split(' ')[1];
      return `Rewards to ${numberOfRecipients} contributors`;
    }
  }
  return '';
}

export function getQuarterFromDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; 
  let quarter = "";
  if (month <= 3) quarter = "Q1";
  else if (month <= 6) quarter = "Q2";
  else if (month <= 9) quarter = "Q3";
  else quarter = "Q4";
  return `${year}-${quarter}`;
}
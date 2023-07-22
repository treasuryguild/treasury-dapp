import axios from "axios";

export async function getAssetList2(tokens, wallet) {
    const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}`
    let updatedTokens = tokens
    try {
      await axios.get(`https://pool.pm/wallet/${wallet}`).then(response => {
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
    }
    return updatedTokens;
}
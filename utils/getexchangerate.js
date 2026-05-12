import axios from "axios";
import { get, set } from "./cache";

export async function getExchangeRate(wallettokens) {
    const tokenNames = wallettokens.map(t => t.name);
    const cached = get('rates');
    if (cached && JSON.stringify(cached.tokens) === JSON.stringify(tokenNames)) {
        console.log('[ExchangeRate] Serving from cache', cached.data);
        if (cached.data['ADA'] !== undefined) {
            const xrates = document.getElementById('xrate');
            if (xrates) xrates.value = cached.data['ADA'];
        }
        return cached.data;
    }

    console.log('[ExchangeRate] Fetching from CoinGecko...');
    let tickerDetails = await axios.get('/api/tickers')
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates = {};
    for (let i in wallettokens) {
      if (wallettokens[i].tokenType == "fungible") {
        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`)
            const rate = response.data[tickers[wallettokens[i].name]].usd;
            if (rate !== undefined) {
              tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
              if (wallettokens[i].name == "ADA") {
                let xrates = document.getElementById('xrate')
                xrates.value = parseFloat(rate).toFixed(3);
              }
            } else {
              tokenExchangeRates[wallettokens[i].name] = 0.00
            }
          } catch (error) {
            if (wallettokens[i].name != "ADA") {
              tokenExchangeRates[wallettokens[i].name] = 0.00
            }
        }
      }
    }
    console.log('[ExchangeRate] Fetched from CoinGecko', tokenExchangeRates);
    set('rates', tokenExchangeRates, tokenNames);
    return tokenExchangeRates;
}
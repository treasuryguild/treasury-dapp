import axios from "axios";

export async function getExchangeRate(wallettokens) {
    console.log("Running API calls to get exchange rates")
    const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}`
    let tickerDetails = await axios.get(tickerAPI)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates = {}
    console.log("wallettokens", wallettokens)
    for (let i in wallettokens) {
      if (wallettokens[i].tokenType == "fungible") {
        try {
          console.log("trying", wallettokens[i])
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`)
            const rate = response.data[tickers[wallettokens[i].name]].usd;
            console.log("Exchange rate response.data", response.data)
            if (rate !== undefined) {
              console.log ("passed first if")
              tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
              if (wallettokens[i].name == "ADA") {
                console.log ("passed second if")
                let xrates = document.getElementById('xrate')
                xrates.value = parseFloat(rate).toFixed(3);
              }
            } else {
              tokenExchangeRates[wallettokens[i].name] = 0.00
            }
          } catch (error) {
            console.log(`Failed to get exchange rate for ${wallettokens[i].name}: `, error);
            if (wallettokens[i].name != "ADA") {
              tokenExchangeRates[wallettokens[i].name] = 0.00
            }
        }
      }
    }
  return tokenExchangeRates;
}
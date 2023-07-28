import axios from "axios";

export async function checkTxStatus(wallet, txId) {
    
    async function getTxs() {
        const url = "https://api.koios.rest/api/v0/address_txs?limit=1";
        const data = {
          _addresses: [wallet],
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        return response.data[0].tx_hash;
    }

    async function getTxStatus(txid) {
      const url = "https://api.koios.rest/api/v0/tx_status";
      const data = {
        _tx_hashes: [txid],
      };
  
      const response = await axios.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data[0].num_confirmations;
    }

    let txid = ''
    if (txId) {
        txid = txId;
    } else {
        txid = await getTxs();
    }
    let confirmations = await getTxStatus(txid)
    //console.log("txid", txid, confirmations)
    if (confirmations > 2) {
        return true
    } else {
        return false
    }
}
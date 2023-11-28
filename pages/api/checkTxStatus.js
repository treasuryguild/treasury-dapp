// pages/api/checkTxStatus.js

import axios from "axios";

export default async function handler(req, res) {
  const { wallet, txId } = req.body;

  async function getTxs() {
    const url = "https://api.koios.rest/api/v1/address_txs?limit=1";
    const data = {
      _addresses: [wallet], 
    };

    const response = await axios.post(url, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KOIOS_API_KEY}`
      },
    });
    return response.data[0].tx_hash;
}

async function getTxStatus(txid) {
  const url = "https://api.koios.rest/api/v1/tx_status";
  const data = {
    _tx_hashes: [txid],
  };

  const response = await axios.post(url, data, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KOIOS_API_KEY}`
    },
  });
  return response.data[0].num_confirmations;
}

  try {
    let txid = txId || await getTxs();
    let confirmations = await getTxStatus(txid);

    if (confirmations > 2) {
      res.status(200).json({ status: true });
    } else {
      res.status(200).json({ status: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const txId = req.body.txid;
    const url = "https://api.koios.rest/api/v1/tx_info";
    const data = {
      _tx_hashes: [txId],
      _inputs: true,
      _metadata: true,
      _assets: true,
      _withdrawals: true,
      _certs: true,
      _scripts: true,
      _bytecode: true
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KOIOS_API_KEY}`
        },
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

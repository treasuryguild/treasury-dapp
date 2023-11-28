// utils/checkTxStatus.js

import axios from "axios";

export async function checkTxStatus(wallet, txId) {
  try {
    const response = await axios.post('/api/checkTxStatus', { wallet, txId });
    return response.data.status;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return false;
  }
}

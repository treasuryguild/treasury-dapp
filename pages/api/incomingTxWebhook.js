// pages/api/incomingTxWebhook.js

import { verifyWebhookSignature, SignatureVerificationError } from "@blockfrost/blockfrost-js";
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const signatureHeader = req.headers["blockfrost-signature"];
    if (!signatureHeader) {
      return res.status(400).send('Missing signature header');
    }

    const SECRET_AUTH_TOKEN = process.env.BLOCKFROST_WEBHOOK_AUTH_TOKEN;
    
    try {
      verifyWebhookSignature(
        JSON.stringify(req.body),
        signatureHeader,
        SECRET_AUTH_TOKEN,
        600
      );
    } catch (error) {
      return res.status(400).send("Invalid signature");
    }

    const { type, payload } = req.body;
    if (type === "transaction") {
      try {
        const netlifyFunctionUrl = `${process.env.APP_URL}/.netlify/functions/handleBlockfrostWebhooks`;
        
        await axios.post(netlifyFunctionUrl, { transactions: payload });

        return res.status(200).json({ message: "Webhook processed and sent to Netlify function" });
      } catch (error) {
        console.error(error);
        return res.status(500).send("Error forwarding data to Netlify function");
      }
    } else {
      return res.status(200).json({ message: "Event type not handled" });
    }
  } else {
    return res.status(405).send("Method Not Allowed");
  }
}

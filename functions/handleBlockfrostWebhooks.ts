// netlify/functions/handleBlockfrostWebhooks.js
import axios from 'axios';

exports.handler = async function(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    try {
        const data = JSON.parse(event.body);
        console.log("Received transactions:", data.transactions);
    
        // Define the URL of your Next.js API route
        const nextApiRouteUrl = `${process.env.APP_URL}/api.discord`;
    
        const transactionEmbed = {
            title: 'New Transaction Received',
            description: 'Details of the transaction:',
            fields: data.transactions.map((tx: any) => ({
                name: `Transaction Hash: ${tx.tx.hash}`,
                value: `Block: ${tx.tx.block}, Amount: ${tx.tx.output_amount.map((amount: any) => `${amount.quantity} ${amount.unit}`).join(", ")}`,
                inline: false
            })),
            color: 3447003 // You can set a color for the embed
        };

        const discordData = {
            content: 'New transaction received',
            embeds: [transactionEmbed],
            wallet: 'your_wallet_id' // Replace with the appropriate wallet identifier
        };

        await axios.post(nextApiRouteUrl, discordData);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Transactions processed and sent to Discord" })
        };
    } catch (error: any) {
        console.error(error);
        return {
            statusCode: 500,
            body: `Server error: ${error.message}`
        };
    }
}
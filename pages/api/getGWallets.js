import axios from 'axios';

export default async function handler(req, res) {
  const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'Form responses 1'?key=${API_KEY}`;

  try {
    const response = await axios.get(API_URL);
    const data = response.data.values;

    if (data && data.length > 0) {
      // Get the index of each column based on the header row
      const timestampIndex = data[0].indexOf("Timestamp");
      const discordHandleIndex = data[0].indexOf("Discord handle");
      const walletAddressIndex = data[0].indexOf("Wallet Address");

      // Map over the rows and return only the necessary columns (ignoring the header row)
      const formattedData = data.slice(1).map(row => ({
        Timestamp: row[timestampIndex],
        DiscordHandle: row[discordHandleIndex],
        WalletAddress: row[walletAddressIndex]
      }));

      res.status(200).json(formattedData);
    } else {
      res.status(404).json({ error: 'No data found' });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

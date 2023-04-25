import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, embeds, wallet } = req.body;
  let webhookUrl = process.env.TEST_DISCORD_WEBHOOK_URL;
  if (wallet == 'addr32r2r3r3') {
    webhookUrl = process.env.TEST2_DISCORD_WEBHOOK_URL;
  }
  const avatarUrl = 'https://www.example.com/avatar.png';

  if (typeof webhookUrl === 'undefined') {
    return res.status(500).json({ error: 'Discord webhook URL is not defined' });
  }
  // Get data from the client-side
  
  axios.post(webhookUrl, {
    username: 'My Bot',
    avatar_url: avatarUrl,
    content: content,
    embeds: embeds,
  })
    .then((response) => {
      res.status(200).json({ message: 'Message sent successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to send message' });
    });
}
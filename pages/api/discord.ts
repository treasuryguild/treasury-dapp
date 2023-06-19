import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, embeds, wallet } = req.body;

  let webhookUrl: string | undefined;
  const webhookUrls: { [key: string]: string | undefined } = {
    'lq69gt': process.env.TEST_DISCORD_WEBHOOK_URL,
    '7zxn7j': process.env.TEST_DISCORD_WEBHOOK_URL,
    '3ynval': process.env.SNET_DISCORD_WEBHOOK_URL,
    't49ftp': process.env.GG_DISCORD_WEBHOOK_URL,
    'msx826': process.env.CGO_DISCORD_WEBHOOK_URL,
    'm45kgs': process.env.SWARM_DISCORD_WEBHOOK_URL,
    'pqfqwr': process.env.METH_DISCORD_WEBHOOK_URL,
    '94cqxx': process.env.SWARM_DISCORD_WEBHOOK_URL,
    'gfyvd3': process.env.SWARM_DISCORD_WEBHOOK_URL,
    'l0lw53': process.env.SWARM_DISCORD_WEBHOOK_URL
    //'c6fs7m': process.env.SNET_DISCORD_WEBHOOK_URL,
    // other wallet addresses
  };
  
  const walletSuffix = wallet.substr(-6);
  webhookUrl = process.env.TEST_DISCORD_WEBHOOK_URL //remember to change to webhookUrls[walletSuffix];

  const avatarUrl = 'https://github.com/treasuryguild/Treasury-Guild/raw/main/logo132.png';

  if (typeof webhookUrl === 'undefined') {
    return res.status(500).json({ error: 'Discord webhook URL is not defined' });
  }
  // Get data from the client-side
  
  axios.post(webhookUrl, {
    username: 'Treasury Guild',
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
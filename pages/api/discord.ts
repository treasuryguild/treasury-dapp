import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, embeds, wallet } = req.body;
  
  let webhookUrl: string | undefined;
  const webhookUrls: { [key: string]: string | undefined } = {
    '3ynval': process.env.SNET_DISCORD_WEBHOOK_URL,
    't49ftp': process.env.GG_DISCORD_WEBHOOK_URL,
    'm45kgs': process.env.SWARM_DISCORD_WEBHOOK_URL,
    '94cqxx': process.env.HIVE_DISCORD_WEBHOOK_URL,
    'gfyvd3': process.env.HIVE_DISCORD_WEBHOOK_URL,
    'l0lw53': process.env.SWARM_DISCORD_WEBHOOK_URL,
    '4tkmkp': process.env.HIVE_DISCORD_WEBHOOK_URL,
    'lq69gt': process.env.TEST_DISCORD_WEBHOOK_URL,
    'vsjlcn': process.env.SNET_DISCORD_WEBHOOK_URL,
    '8evnfn': process.env.UNIFIRES_DISCORD_WEBHOOK_URL,
    'q28dsh': process.env.MESH_DISCORD_WEBHOOK_URL,
    'pusg4p': process.env.SIDAN_DISCORD_WEBHOOK_URL
  };
    //'c6fs7m': process.env.SNET_DISCORD_WEBHOOK_URL, //GovWG 
    // other wallet addresses
  const walletSuffix = wallet.substr(-6);
  webhookUrl = webhookUrls[walletSuffix] //remember to change to webhookUrls[walletSuffix];

  const avatarUrl = 'https://github.com/treasuryguild/treasury-dapp/raw/main/public/logo132.png';

  if (typeof webhookUrl === 'undefined') {
    webhookUrl = process.env.TEST_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Discord webhook URL is not defined' });
    }
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
      res.status(500).json({ error: 'Failed to send message', axiosError: err.message });
    });
}
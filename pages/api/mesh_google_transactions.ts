// src/pages/api/mesh_google_transactions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { recordTransaction } from '../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received request body:', req.body); // Debug log
    const transaction = req.body;
    await recordTransaction(transaction);
    
    res.status(200).json({ message: 'Transaction recorded successfully' });
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ 
      message: 'Failed to record transaction', 
      error: error.message 
    });
  }
}
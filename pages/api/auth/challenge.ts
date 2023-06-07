import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { address } = req.body;
    
    // Create a random challenge and associate it with the user's wallet address
    const challenge = uuidv4();
    console.log("challenge", challenge)
    // Store the challenge in Supabase
    const { data, error } = await supabase
      .from('challenges')
      .insert([{ address, challenge }]);

    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Error storing challenge in Supabase' });
      return;
    }

    res.status(200).json({ challenge });
  } else {
    res.status(405).json({ error: 'We only support POST' });
  }
}

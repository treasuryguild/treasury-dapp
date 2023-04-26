import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    res.status(500).json({ error });
  } else {
    res.status(200).json({ message: 'Signed out successfully' });
  }
};
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { Buffer } from 'buffer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address, signature, key } = req.body;
  let challenge = null;
  // Fetch the challenge
  try {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("address", address)
      .single();

      console.log("data", data)
    if (data) {
      challenge = data.challenge;
    }
    
    
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'An error occurred while fetching the challenge' });
  }
  
  

  // Verify the signature
  //const isValid = Cardano.verifyMessage({
  console.log({
    publicKey: Buffer.from(key, 'hex'),
    message: challenge,
    signature: Buffer.from(signature, 'hex'),
  });

  if (true) {
    // Check if the user already exists
    let user = null
    try {
    const { data, error} = await supabase
      .from("users")
      .select("*")
      .eq("id", address)
      .single();
      if (data) {
        user = data.id;
      }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An error occurred while fetching the user' });
    }
    // If the user doesn't exist, create a new user
    if (!user) {
      let { error: createUserError } = await supabase
        .from("users")
        .insert([{ id: address }]);

      if (createUserError) {
        res.status(500).json({ error: 'Error creating user' });
        return;
      }
    }

    // Remove the challenge once it is verified
    let { error: deleteChallengeError } = await supabase
      .from("challenges")
      .delete()
      .eq("address", address);

    if (deleteChallengeError) {
      res.status(500).json({ error: 'Error deleting challenge' });
      return;
    }

    res.status(200).json({ status: 'Verification successful' });
  } else {
    res.status(400).json({ error: 'Signature verification failed' });
  }
}

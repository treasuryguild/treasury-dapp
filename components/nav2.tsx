import Link from 'next/link';
import { useState, useEffect } from "react";
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useWallet } from '@meshsdk/react';

const Nav = () => {
  const [session, setSession] = useState<Session | null>(null)
  const { connected, wallet } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null)
  const [userData, setUserData] = useState({})
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  async function signInWithWallet() {
    // Retrieve used addresses
    const usedAddresses = await wallet.getUsedAddresses();
    const currentAddress = usedAddresses[0];
    setWalletAddress(currentAddress);
  
    // Request a challenge for this wallet address
    const response = await axios.post('/api/auth/challenge', { address: currentAddress });
    setChallenge(response.data.challenge);
  
    if (response.data.challenge !== null) {
      // Sign the challenge with the wallet
      const signature = await wallet.signData(currentAddress, response.data.challenge);
      console.log("signature", signature)
      // Send the signed challenge and wallet address to the verify endpoint
      const verificationResponse = await axios.post('/api/auth/verify', { address: currentAddress, signature: signature.signature, key: signature.key });
  
      if (verificationResponse.data.status === 'Verification successful') {
        // Set the session manually after successful verification
        setSession({user: {id: currentAddress}});

      }
    } else {
      // Handle the case where challenge is null
      console.log('Challenge is null. Cannot sign the data.');
    }
  }  
  
  async function signout() {
    const { error } = await supabase.auth.signOut()
    setSession(null);
  }
  console.log("session",session)
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          <Link href='/txbuilder' className="navitems">
            Build Transaction
          </Link>
          <Link href='/transactions' className="navitems">
            Transaction History
          </Link>
          {!session && connected && (<button onClick={signInWithWallet} className="navitems">
          Sign In with Wallet
        </button>)}
          {session && connected && (
          <button onClick={signout} className="navitems">
          Sign Out
          </button>)}
    </nav>
  );
};

export default Nav;

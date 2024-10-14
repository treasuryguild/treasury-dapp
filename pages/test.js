// ../pages/test.js
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { getTxInfo } from '../utils/getTxInfo';
import { getTxDetails } from '../utils/getTxDetails';
import axios from 'axios';
import { getTokenTypes } from '../utils/getTokenTypes';
import config from '../public/config.json';

export default function TestPage() {
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(false);

    const { txHash, usedAddresses, rewardAddress, assets } = config;

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
        setIsAdmin(true)
      }
    })
    const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
    })
    return () => subscription.unsubscribe()
    }, [])
    
    useEffect(() => {
        if (isAdmin) {
            console.log("isAdmin", isAdmin)
        }
    }, [isAdmin]);

  async function txInfo(txid) {
    const response = await axios.post('/api/getTxInfo', { txid });
    return response.data;
  }

  async function checkOldTransactionType() {
    setIsLoading(true);
    try {
      const tTypes = await getTokenTypes();
      const txData = await txInfo(txHash[0]);
      const result = await getTxInfo(usedAddresses, txData[0], assets, tTypes);
      const fee = parseInt(txData[0].fee)
      console.log("txData[0]", txData[0], assets, tTypes, fee)
      console.log("result", result)
    } catch (error) {
      console.error("Error in checkOldTransactionType:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkNewTransactionType() {
    setIsLoading(true);
    try {
      const tTypes = await getTokenTypes();
      const txData = await txInfo(txHash[0]);
      const test = await getTxDetails(rewardAddress, txData[0], assets, tTypes);
      const fee = parseInt(txData[0].fee)
      console.log("txData[0]", txData[0], assets, tTypes, fee)
      console.log("test", test, rewardAddress)
    } catch (error) {
      console.error("Error in checkNewTransactionType:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <h1>404 - Page Not Found</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Test Page</h1>
      <div>
        <button
          onClick={checkOldTransactionType}
          disabled={isLoading}
          className="button"
        >
          Check Old Transaction Type
        </button>
        <button
          onClick={checkNewTransactionType}
          disabled={isLoading}
          className="button"
        >
          Check New Transaction Type
        </button>
        {isLoading && <p className="loading">Loading...</p>}
      </div>
    </div>
  );
}
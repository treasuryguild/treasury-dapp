// ../pages/test.js
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { getTxInfo } from '../utils/getTxInfo';
import { getTxDetails } from '../utils/getTxDetails';
import axios from 'axios';
import { getTokenTypes } from '../utils/getTokenTypes';

// Conditional import of config
let config = {
    txHash: [],
    usedAddresses: [],
    rewardAddress: "",
    assets: []
};

export default function TestPage() {
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(false);

    const { txHash, usedAddresses, rewardAddress, assets } = config;
    
    const transactionHash = txHash[6]  // Change the index to test different transaction types
    // 0. Convert WMT to WMTX with Smart contract
    // 1. Sending tokens to Minswap for token swap
    // 2. Receiving tokens from Minswap for token swap
    // 3. Sending tokens to multiple addresses
    // 4. Receiving tokens from address
    // 5. Minting new tokens
    // 6. Burning tokens

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
            try {
              config = require('../public/config.json');
            } catch (error) {
                console.warn("Config file not found. Using default empty values.");
            }
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
            const txData = await txInfo(transactionHash);
            console.log("tTypes", tTypes);
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
            const txData = await txInfo(transactionHash);
            const test = await getTxDetails(rewardAddress, txData[0], tTypes);
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
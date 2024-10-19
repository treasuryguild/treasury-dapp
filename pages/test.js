import React, { useState, useEffect } from "react";
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

const transactionTypes = [
    "Convert WMT to WMTX with Smart contract",
    "Sending tokens to Minswap for token swap",
    "Receiving tokens from Minswap for token swap",
    "Sending tokens to multiple addresses",
    "Receiving tokens from address",
    "Minting new tokens",
    "Burning tokens",
    "Drep registration",
    "Drep delegation",
    "Reward Withdrawal"
];

export default function TestPage() {
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsAdmin(session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsAdmin(session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN);
        });

        return () => subscription.unsubscribe();
    }, []);
    
    useEffect(() => {
        if (isAdmin) {
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

    async function checkTransactionType(index, isOld) {
        setIsLoading(true);
        try {
            const { txHash, usedAddresses, rewardAddress, assets } = config;
            const tTypes = await getTokenTypes();
            const txData = await txInfo(txHash[index]);
            
            if (isOld) {
                const result = await getTxInfo(usedAddresses, txData[0], assets, tTypes);
                console.log("Old Method Result:", result);
            } else {
                const result = await getTxDetails(rewardAddress, txData[0], tTypes);
                console.log("New Method Result:", result);
            }
            
            console.log("Transaction Data:", txData[0]);
            console.log("Fee:", parseInt(txData[0].fee));
        } catch (error) {
            console.error(`Error in checking transaction type (${isOld ? 'Old' : 'New'} method):`, error);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isAdmin) {
        return <h1>404 - Page Not Found</h1>;
    }

    return (
        <div>
            <h1>Transaction Type Test Page</h1>
            {transactionTypes.map((type, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                    <h3>{type}</h3>
                    <button
                        onClick={() => checkTransactionType(index, true)}
                        disabled={isLoading}
                        className="button"
                    >
                        Check Old Method
                    </button>
                    <button
                        onClick={() => checkTransactionType(index, false)}
                        disabled={isLoading}
                        className="button"
                        style={{ marginLeft: '10px' }}
                    >
                        Check New Method
                    </button>
                </div>
            ))}
            {isLoading && <p className="loading">Loading...</p>}
        </div>
    );
}
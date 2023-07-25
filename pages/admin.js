import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { sendDiscordMessage } from '../utils/sendDiscordMessage'
import { commitFile } from '../utils/commitFile'

export default function AdminPage() {
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [myVariable, setMyVariable] = useState([]);
    const [metaData, setMetaData] = useState([]);
    const [thash, setThash] = useState([]);
    const [customFilePath, setCustomFilePath] = useState([]);

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

    async function getLatestTx() {
        try {
            const { data, error, status } = await supabase
            .from("transactioninfo")
            .select('txinfo, txhash, txfilepath, metadata')
            .order('created_at', { ascending: false })
            .limit(4);
            
            if (error && status !== 406) throw error
            if (data) {
              setMyVariable(data.map(d => d.txinfo));
              setMetaData(data.map(d => d.metadata));
              setThash(data.map(d => d.txhash));
              setCustomFilePath(data.map(d => d.txfilepath));
            }
        } catch (error) {
            if (error) {
              alert(error.message);
            } else {
              console.error('Unknown error:', error);
            }
        }
    }

    async function test() {
        await getLatestTx();
    }

    async function sendMessage(index) {
        await sendDiscordMessage(myVariable[index]);
    }

    async function gitCommit(index) {
        let customFileContent = ''
        let newMetaData = metaData[index]
        newMetaData['txid'] = thash[index]
        customFileContent = `${JSON.stringify(newMetaData, null, 2)}`; 
        await commitFile(customFilePath[index], customFileContent) 
    }
    
    useEffect(() => {
        if (isAdmin) {
            test()
        }
    }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <h1>404 - Page Not Found</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, Admin!</h1>
      {myVariable.map((transaction, index) => (
        <div key={index}>
          <p>{transaction.project} - {transaction.txdescription}</p>
          <button onClick={() => sendMessage(index)}>Send Discord Message</button>
          <button onClick={() => gitCommit(index)}>Commit File to GitHub</button>
        </div>
      ))}
    </div>
  );
}
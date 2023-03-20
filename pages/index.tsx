import { useState } from "react";
import type { NextPage } from "next";
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import Link from 'next/link'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const router = useRouter()

  const handleClick = () => {
    console.log('Choosing treansaciton type')
    router.push('/transaction')
  }

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function getAssets() {
    if (wallet) {
      setLoading(true);
      const _assets = await wallet.getAssets();
      setAssets(_assets);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Connect Wallet</h1>
      <CardanoWallet />
      <h1>Welcome Home</h1>
      <Link href='/transaction'>
        Build Transaction
      </Link>
      <Link href='/txhistory'>
        View Transaction History
      </Link>
      <button onClick={handleClick}>Place Order</button>
      <div>Test</div>
      {connected && (
        <>
          <h1>Get Wallet Assets</h1>
          {assets ? (
            <pre>
              <code className="language-js">
                {JSON.stringify(assets, null, 2)}
              </code>
            </pre>
          ) : (
            <button
              type="button"
              onClick={() => getAssets()}
              disabled={loading}
              style={{
                margin: "8px",
                backgroundColor: loading ? "orange" : "grey",
              }}
            >
              Get Wallet Assets
            </button>
          )}
        </>
      )}
      
    </div>
  );
};

export default Home;
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MeshProvider } from "@meshsdk/react";
import { CardanoWallet } from '@meshsdk/react';
import Nav from '../components/nav'
import { MeshBadge } from '@meshsdk/react';

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <>
    <MeshProvider>
      <div className="main">
        <div className="nav">
          <div>
            <Nav />
          </div>
          <div className="walletbutton">
            <CardanoWallet />  
          </div>
        </div>
        <div className="component">
          <Component {...pageProps} />
        </div>
        <div className="mesh-badge">
          Powered by
          <MeshBadge dark={true} />
        </div>
      </div>
    </MeshProvider>
    </>
  );
}

export default MyApp;
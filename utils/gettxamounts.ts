import { Address, StakeCredential, RewardAddress } from '@emurgo/cardano-serialization-lib-asmjs';

export function getTxAmounts(decodedtext: any) {
  
  function uint8ArrayToHex(uint8Array: Uint8Array) {
    return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToUint8Array(hexString: any) {
    const length = hexString.length;
    const uint8Array = new Uint8Array(length / 2);
    for (let i = 0; i < length; i += 2) {
      uint8Array[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return uint8Array;
  }
  const cbor = require('cbor-js');
  const txamounts: any = {};
  const unsignedTxUint8Array = hexToUint8Array(decodedtext);
  const decodedData = cbor.decode(unsignedTxUint8Array.buffer);

  for (let i = 0; i < decodedData[0][1].length - 1; i++) {
    if (decodedData[0][1][i][1][0]) {
      const hexEncodedData = uint8ArrayToHex(decodedData[0][1][i][0]);
      //console.log(decodedData, hexEncodedData);
      const addressBytes = Buffer.from(hexEncodedData, 'hex');
      const address = Address.from_bytes(addressBytes);
      const walletAddress = address.to_bech32();
      if(txamounts[walletAddress] === undefined) {
        txamounts[walletAddress] = {};
      }
      if(txamounts[walletAddress]["ADA"] === undefined) {
        txamounts[walletAddress]["ADA"] = 0;
      }
      txamounts[walletAddress]["ADA"] = txamounts[walletAddress]["ADA"] + decodedData[0][1][i][1][0]
      //console.log("array", decodedData[0][1][i][1][0], walletAddress);
    } else {
      const hexEncodedData = uint8ArrayToHex(decodedData[0][1][i][0]);
      //console.log(decodedData, hexEncodedData);
      const addressBytes = Buffer.from(hexEncodedData, 'hex');
      const address = Address.from_bytes(addressBytes);
      const walletAddress = address.to_bech32();
      if(txamounts[walletAddress] === undefined) {
        txamounts[walletAddress] = {};
      }
      if(txamounts[walletAddress]["ADA"] === undefined) {
        txamounts[walletAddress]["ADA"] = 0;
      }
      txamounts[walletAddress]["ADA"] = txamounts[walletAddress]["ADA"] + decodedData[0][1][i][1]
      //console.log("not array", decodedData[0][1][i][1], walletAddress);
    }
}

  for (let walletAddress in txamounts) {
    // Divide by 10**6 and round to 6 decimal places
    txamounts[walletAddress]["ADA"] = Number((txamounts[walletAddress]["ADA"] / (10**6)).toFixed(6));
  }
  return txamounts;
}
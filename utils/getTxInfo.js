export async function getTxInfo(usedAddresses, txData, assets) {
  const inputs = txData.inputs;
  const outputs = txData.outputs;

  let addressAssets = {};
  let idCounter = 1;
  let transactionType = "";

  // Determine if it's an outgoing transaction
  let isOutgoing = false;
  for (const input of inputs) {
    if (usedAddresses.includes(input.payment_addr.bech32)) {
      isOutgoing = true;
      break;
    }
  }

  if (isOutgoing) {
    transactionType = "Outgoing";
    // If it's an outgoing transaction, gather information about the addresses to which the funds are sent
    for (const output of outputs) {
      if (!usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = output.asset_list.map(outgoingAsset => {
          for (let asset of assets) {
            if (asset.fingerprint === outgoingAsset.fingerprint) {
              let assetName = asset.assetName;
              let decimals = outgoingAsset.decimals;

              // Adjust name and decimals for gimbal
              if (assetName.toLowerCase() === 'gimbal') {
                assetName = 'GMBL';
                decimals = 6;
              }

              outgoingAsset = {
                id: idCounter.toString(),
                name: assetName,
                amount: parseFloat(outgoingAsset.quantity),
                unit: asset.unit,
                fingerprint: asset.fingerprint,
                decimals: decimals
              };
              idCounter++;
              break;
            }
          }
          return outgoingAsset;
        });

        // Include ADA token
        assetList.push({
          id: idCounter.toString(),
          name: 'ADA',
          amount: parseFloat(output.value),
          unit: 'lovelace',
          fingerprint: '',
          decimals: 6
        });
        idCounter++;

        if(addressAssets[output.payment_addr.bech32]) {
          // Address already exists, update the token amounts and add new ones if they are not present yet
          addressAssets[output.payment_addr.bech32].forEach((existingToken, index) => {
            const correspondingNewToken = assetList.find(token => token.fingerprint === existingToken.fingerprint);
            if(correspondingNewToken) {
              // Update the amount of the existing token
              existingToken.amount += parseFloat(correspondingNewToken.amount);
              // Remove the token from the assetList as it's already in the addressAssets
              const index = assetList.indexOf(correspondingNewToken);
              assetList.splice(index, 1);
            }
          });

          // Add remaining new tokens from assetList to addressAssets
          addressAssets[output.payment_addr.bech32].push(...assetList);
        } else {
          // New address, add it to the addressAssets
          addressAssets[output.payment_addr.bech32] = assetList;
        }
      }
    }
    console.log('Outgoing transactions info:', addressAssets);
  } else {
    transactionType = "Incoming";
    // If it's an incoming transaction, calculate total incoming value and gather asset lists
    for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = output.asset_list.map(incomingAsset => {
          for (let asset of assets) {
            if (asset.fingerprint === incomingAsset.fingerprint) {
              let assetName = asset.assetName;
              let decimals = incomingAsset.decimals;

              // Adjust name and decimals for gimbal
              if (assetName.toLowerCase() === 'gimbal') {
                assetName = 'GMBL';
                decimals = 6;
              }

              incomingAsset = {
                id: idCounter.toString(),
                name: assetName,
                amount: parseFloat(incomingAsset.quantity),
                unit: asset.unit,
                fingerprint: asset.fingerprint,
                decimals: decimals
              };
              idCounter++;
              break;
            }
          }
          return incomingAsset;
        });

        // Include ADA token
        assetList.push({
          id: idCounter.toString(),
          name: 'ADA',
          amount: parseFloat(output.value),
          unit: 'lovelace',
          fingerprint: '',
          decimals: 6
        });
        idCounter++;

        if(addressAssets[output.payment_addr.bech32]) {
          // Address already exists, update the token amounts and add new ones if they are not present yet
          addressAssets[output.payment_addr.bech32].forEach((existingToken, index) => {
            const correspondingNewToken = assetList.find(token => token.fingerprint === existingToken.fingerprint);
            if(correspondingNewToken) {
              // Update the amount of the existing token
              existingToken.amount += parseFloat(correspondingNewToken.amount);
              // Remove the token from the assetList as it's already in the addressAssets
              const index = assetList.indexOf(correspondingNewToken);
              assetList.splice(index, 1);
            }
          });

          // Add remaining new tokens from assetList to addressAssets
          addressAssets[output.payment_addr.bech32].push(...assetList);
        } else {
          // New address, add it to the addressAssets
          addressAssets[output.payment_addr.bech32] = assetList;
        }
      }
    }
    console.log('Incoming transactions info:', addressAssets);
  }

  // Divide amounts by 10**decimals after all aggregation has happened
  for (let address in addressAssets) {
    addressAssets[address].forEach(token => {
      token.amount = (token.amount / Math.pow(10, token.decimals)).toFixed(token.decimals);
    });
  }

  return { addressAssets, transactionType };
}

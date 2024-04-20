export async function getTxInfo(usedAddresses, txData, assets, tTypes) {
  const inputs = txData.inputs;
  const outputs = txData.outputs;
  const certificates = txData.certificates;
  const assets_minted = txData.assets_minted;
  //console.log(usedAddresses, txData, assets, tTypes);
  let addressAssets = {};
  let idCounter = 1;
  let transactionType = "";
  
  let isOutgoing = false;
  let isStaking = false;
  let isInternalTransfer = false;
  let isMinting = false;
  let isBurning = false;

  let totalInputValue = 0;
  let totalOutputValue = 0;

  let firstInputAddress = null;

  function getAssetNameFromTTypes(fingerprint, tTypes) {
    const typeEntry = tTypes.find(tType => tType.fingerprint === fingerprint);
    return typeEntry ? typeEntry.asset_name : 'Unknown';
  }  

  for (const input of inputs) {
    if (usedAddresses.includes(input.payment_addr.bech32)) {
      totalInputValue += parseFloat(input.value);
      if (!firstInputAddress) {
        firstInputAddress = input.payment_addr.bech32;
      }
        if (inputs.length === 1 && outputs.length === 1 && inputs[0].payment_addr.bech32 === outputs[0].payment_addr.bech32
          || txData.withdrawals && txData.withdrawals.length > 0) {
          isStaking = true;
        } else if (assets_minted?.length > 0 && assets_minted.some(asset => BigInt(asset.quantity) > 0n)) {
          isMinting = true;
        } else if (assets_minted?.length > 0 && assets_minted.some(asset => BigInt(asset.quantity) < 0n)) {
          isBurning = true;
        } else if (outputs.every(output => inputs.every(input => input.stake_addr === output.stake_addr))) {
          isInternalTransfer = true;
          isStaking = true;
        }
      if (!isStaking && !isMinting && !isBurning) {
        isOutgoing = true;
      }
      break;
    }
  }

if (outputs.length === 0 && totalInputValue === parseFloat(txData.fee)) {
  //console.log("Wallet Emptied")
  transactionType = "Wallet Emptied";
  isOutgoing = true;

  // Handle the case where the fee is equal to the total input value
  addressAssets[firstInputAddress] = [
    {
      id: idCounter.toString(),
      name: 'ADA',
      amount: -totalInputValue,
      unit: 'lovelace',
      fingerprint: '',
      decimals: 6
    }
  ];
  idCounter++;
} else if (isStaking) {
    let adaAmount = 0;

    // If there are withdrawals, use the withdrawal amount for ADA
    if (txData.withdrawals && txData.withdrawals.length > 0) {
      transactionType = "Rewards Withdrawal";
      adaAmount = parseFloat(txData.withdrawals[0].amount);
      if (!addressAssets[firstInputAddress]) {
        addressAssets[firstInputAddress] = [];
      }
      addressAssets[firstInputAddress].push({
        id: idCounter.toString(),
        name: 'ADA',
        amount: adaAmount,
        unit: 'lovelace',
        fingerprint: '',
        decimals: 6
      });
      idCounter++;
    } else {
      transactionType = "Staking";
      for (const output of outputs) {
        if (usedAddresses.includes(output.payment_addr.bech32)) {
          totalOutputValue += parseFloat(output.value);
          let difference = 0.00
          if (isInternalTransfer && !(certificates && certificates.length > 0 && certificates[0].type === 'delegation')) {
            transactionType = "Internal Transfer";
            difference = parseFloat(txData.fee);
          } else if (isInternalTransfer && (certificates && certificates.length > 0 && certificates[0].type === 'delegation')) {
            transactionType = "Staking";
            difference = parseFloat(txData.fee);
          } else {
            difference = totalInputValue - totalOutputValue - parseFloat(txData.fee);
          }
          // If difference is not zero, it means ADA has been gained or lost
          if (difference !== 0) {
            adaAmount = difference;
          }

          if (!addressAssets[output.payment_addr.bech32]) {
            addressAssets[output.payment_addr.bech32] = [];
          }
          addressAssets[output.payment_addr.bech32].push({
            id: idCounter.toString(),
            name: 'ADA',
            amount: adaAmount,
            unit: 'lovelace',
            fingerprint: '',
            decimals: 6
          });
          idCounter++;
        }
        if (isInternalTransfer) {break;}
      }
    }

  } else if (isMinting || isBurning) {
    transactionType = isMinting ? "Minting": "Burning";
    
    // Calculate total input and output values
    let totalInputValue = 0;
    let totalOutputValue = 0;
    
    for (const input of inputs) {
      if (usedAddresses.includes(input.payment_addr.bech32)) {
        totalInputValue += parseFloat(input.value);
      }
    }
    
    for (const output of outputs) {
      totalOutputValue += parseFloat(output.value);
    }
  
    // The difference will be the outgoing ADA amount
    let outgoingAdaAmount = totalInputValue - totalOutputValue;
    //console.log(totalInputValue, totalOutputValue, outgoingAdaAmount)
    
    // Handle outgoing ADA
    for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        let ada = {
          id: idCounter.toString(),
          name: 'ADA',
          amount: Number(0 - outgoingAdaAmount),  // minus fee, because it gets handled same as Incoming
          unit: 'lovelace',
          fingerprint: '',
          decimals: 6
        };
        idCounter++;
        
        if(addressAssets[output.payment_addr.bech32]) {
          addressAssets[output.payment_addr.bech32].push(ada);
        } else {
          addressAssets[output.payment_addr.bech32] = [ada];
        }
        break;
      }
    }
    
    // Handle incoming tokens
    if (txData.assets_minted.length > 0) {
      let mintedAddress = (Object.keys(addressAssets))[0];
      //console.log("addressAssets", (Object.keys(addressAssets))[0])
      const assetList = txData.assets_minted.map(assetItem => {
          let assetName;
          let assetFoundInAssets = assets.find(asset => asset.fingerprint === assetItem.fingerprint);
        
          if (assetFoundInAssets && assetFoundInAssets.assetName) {
            assetName = assetFoundInAssets.assetName;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
              let decimals = assetItem.decimals;

            // Adjust name and decimals for gimbal
            if (assetName.toLowerCase() === 'gimbal') {
              assetName = 'GMBL';
              decimals = 6;
            }

            assetItem = {
              id: idCounter.toString(),
              name: assetName,
              amount: parseFloat(assetItem.quantity),
              unit: assetItem.unit,
              fingerprint: assetItem.fingerprint,
              decimals: decimals
            };
            idCounter++;
        return assetItem;
      });
      addressAssets[mintedAddress].push(...assetList);
      //console.log("assetsMinted", txData.assets_minted)
    } else {
      for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = output.asset_list.map(assetItem => {
          let assetName;
          let assetFoundInAssets = assets.find(asset => asset.fingerprint === assetItem.fingerprint);
        
          if (assetFoundInAssets && assetFoundInAssets.assetName) {
            assetName = assetFoundInAssets.assetName;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
              let decimals = assetItem.decimals;
  
              // Adjust name and decimals for gimbal
              if (assetName.toLowerCase() === 'gimbal') {
                assetName = 'GMBL';
                decimals = 6;
              }
  
              assetItem = {
                id: idCounter.toString(),
                name: assetName,
                amount: parseFloat(assetItem.quantity),
                unit: assetItem.unit,
                fingerprint: assetItem.fingerprint,
                decimals: decimals
              };
              idCounter++;
          return assetItem;
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
  }
  //console.log("addressAssets", addressAssets)
  
  } else if (isOutgoing) {
    transactionType = "Outgoing";
    // If it's an outgoing transaction, gather information about the addresses to which the funds are sent
    for (const output of outputs) {
      if (!usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = output.asset_list.map(assetItem => {
          let assetName;
          let assetFoundInAssets = assets.find(asset => asset.fingerprint === assetItem.fingerprint);
        
          if (assetFoundInAssets && assetFoundInAssets.assetName) {
            assetName = assetFoundInAssets.assetName;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
              let decimals = assetItem.decimals;

              // Adjust name and decimals for gimbal
              if (assetName.toLowerCase() === 'gimbal') {
                assetName = 'GMBL';
                decimals = 6;
              }

              assetItem = {
                id: idCounter.toString(),
                name: assetName,
                amount: parseFloat(assetItem.quantity),
                unit: assetItem.unit,
                fingerprint: assetItem.fingerprint,
                decimals: decimals
              };
              idCounter++;
          return assetItem;
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
  } else {
    transactionType = "Incoming";
    // If it's an incoming transaction, calculate total incoming value and gather asset lists
    for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = output.asset_list.map(assetItem => {
          let assetName;
          let assetFoundInAssets = assets.find(asset => asset.fingerprint === assetItem.fingerprint);
        
          if (assetFoundInAssets && assetFoundInAssets.assetName) {
            assetName = assetFoundInAssets.assetName;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
              let decimals = assetItem.decimals;

              // Adjust name and decimals for gimbal
              if (assetName.toLowerCase() === 'gimbal') {
                assetName = 'GMBL';
                decimals = 6;
              }

              assetItem = {
                id: idCounter.toString(),
                name: assetName,
                amount: parseFloat(assetItem.quantity),
                unit: assetItem.unit,
                fingerprint: assetItem.fingerprint,
                decimals: decimals
              };
              idCounter++;
          return assetItem;
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
  }

  // Divide amounts by 10**decimals after all aggregation has happened
  for (let address in addressAssets) {
    addressAssets[address].forEach(token => {
      token.amount = (token.amount / Math.pow(10, token.decimals)).toFixed(token.decimals);
    });
  }
  //console.log("addressAssets, transactionType", addressAssets, transactionType)
  return { addressAssets, transactionType };
}

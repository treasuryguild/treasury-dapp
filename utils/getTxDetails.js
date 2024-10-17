// Helper functions
const helpers = {
  isPlutusContractPresent: (txData) => txData.plutus_contracts && txData.plutus_contracts.length > 0,
  hasCollateral: (txData) => txData.collateral_inputs && txData.collateral_inputs.length > 0 && txData.collateral_output,
  findMatchingOutput: (outputs, rewardAddress) => outputs.find(output => output.stake_addr === rewardAddress),
  hasAssetsMinted: (txData) => txData.assets_minted && txData.assets_minted.length > 0,
  hasNativeScriptMint: (txData) => txData.native_scripts && txData.native_scripts.length > 0 && txData.assets_minted && txData.assets_minted.length > 0,
  hasTokensBurned: (txData) => 
    txData.assets_minted && 
    txData.assets_minted.some(asset => parseInt(asset.quantity) < 0),
    processBurnedAssets: (txData) => {
      const assets = [];
      let assetIdCounter = 2;
  
      txData.assets_minted.forEach(asset => {
        if (parseInt(asset.quantity) < 0) {
          assets.push({
            amount: (parseInt(asset.quantity) * -1).toString(), // Convert to positive
            decimals: asset.decimals || 0,
            fingerprint: asset.fingerprint || "",
            id: assetIdCounter.toString(),
            name: asset.asset_name,
            unit: `${asset.policy_id}.${asset.asset_name}`
          });
          assetIdCounter++;
        }
      });
  
      return { assets, assetIdCounter };
    },
  processAssets: (output, assetIdCounter = 2) => {
    const assets = [];
    const adaAmount = parseInt(output.value) / 1000000;
    
    assets.push({
      amount: adaAmount.toString(),
      decimals: 6,
      fingerprint: "",
      id: "1",
      name: "ADA",
      unit: "lovelace"
    });

    if (output.asset_list && output.asset_list.length > 0) {
      output.asset_list.forEach(asset => {
        assets.push({
          amount: asset.quantity,
          decimals: asset.decimals || 0,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name: asset.asset_name,
          unit: `${asset.policy_id}.${asset.asset_name}`
        });
        assetIdCounter++;
      });
    }

    return { assets, assetIdCounter };
  },
  processNewlyMintedAssets: (output, assetsMinted) => {
    const assets = [];
    let assetIdCounter = 2;

    if (output.asset_list && output.asset_list.length > 0) {
      output.asset_list.forEach(asset => {
        // Check if this asset is in the assets_minted array
        const mintedAsset = assetsMinted.find(
          minted => minted.policy_id === asset.policy_id && minted.asset_name === asset.asset_name
        );

        if (mintedAsset) {
          assets.push({
            amount: asset.quantity,
            decimals: asset.decimals || 0,
            fingerprint: asset.fingerprint || "",
            id: assetIdCounter.toString(),
            name: asset.asset_name,
            unit: `${asset.policy_id}.${asset.asset_name}`
          });
          assetIdCounter++;
        }
      });
    }

    return { assets, assetIdCounter };
  }
};

const transactionTypes = {
  SMART_CONTRACT_MINT: {
    name: "Smart contract mint",
    identify: (txData, rewardAddress) => {
      return helpers.isPlutusContractPresent(txData) &&
             helpers.hasCollateral(txData) &&
             helpers.hasAssetsMinted(txData) &&
             txData.inputs.some(input => input.stake_addr === rewardAddress) &&
             helpers.findMatchingOutput(txData.outputs, rewardAddress);
    },
    process: (txData, rewardAddress) => {
      let addressAssets = {};
      
      // Find the output that matches our reward address (where we receive the newly minted tokens)
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      
      if (matchingOutput) {
        const { assets } = helpers.processAssets(matchingOutput);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
      }

      return addressAssets;
    }
  },
  TOKEN_SWAP: {
    name: "Token swap",
    identify: (txData, rewardAddress) => {
      const inputs = txData.inputs;
      const outputs = txData.outputs;

      const allInputsMatchRewardAddress = inputs.every(input => input.stake_addr === rewardAddress);
      if (!allInputsMatchRewardAddress) return false;

      const swapOutput = outputs.find(output => output.stake_addr !== rewardAddress && output.datum_hash !== null);
      return !!swapOutput;
    },
    process: (txData, rewardAddress) => {
      const inputs = txData.inputs;
      const outputs = txData.outputs;
      let addressAssets = {};
      let assetIdCounter = 2;

      const inputAddresses = new Set(inputs.map(input => input.payment_addr.bech32));

      outputs.forEach(output => {
        if (!inputAddresses.has(output.payment_addr.bech32)) {
          const { assets, newAssetIdCounter } = helpers.processAssets(output, assetIdCounter);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return addressAssets;
    }
  },
  SMART_CONTRACT_TOKEN_RECEIPT: {
    name: "Smart contract token receipt",
    identify: (txData, rewardAddress) => {
      return helpers.isPlutusContractPresent(txData) &&
             helpers.findMatchingOutput(txData.outputs, rewardAddress) &&
             helpers.hasCollateral(txData);
    },
    process: (txData, rewardAddress) => {
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets } = helpers.processAssets(matchingOutput);
        return { [matchingOutput.payment_addr.bech32]: assets };
      }
      return {};
    }
  },
  MULTI_SEND: {
    name: "Multi-send",
    identify: (txData, rewardAddress) => {
      const allInputsMatchRewardAddress = txData.inputs.every(input => input.stake_addr === rewardAddress);
      const hasOutputsWithDifferentStakeAddr = txData.outputs.some(output => output.stake_addr !== rewardAddress);
      return allInputsMatchRewardAddress && 
             hasOutputsWithDifferentStakeAddr && 
             !helpers.isPlutusContractPresent(txData) && 
             !helpers.hasCollateral(txData);
    },
    process: (txData, rewardAddress) => {
      let addressAssets = {};
      let assetIdCounter = 2;

      txData.outputs.forEach(output => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, newAssetIdCounter } = helpers.processAssets(output, assetIdCounter);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return addressAssets;
    }
  },
  TOKEN_RECEIVE: {
    name: "Token receive",
    identify: (txData, rewardAddress) => {
      const rewardAddressNotInInputs = txData.inputs.every(input => input.stake_addr !== rewardAddress);
      const rewardAddressInOutputs = txData.outputs.some(output => output.stake_addr === rewardAddress);
      return rewardAddressNotInInputs && 
             rewardAddressInOutputs && 
             !helpers.isPlutusContractPresent(txData) && 
             !helpers.hasCollateral(txData);
    },
    process: (txData, rewardAddress) => {
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets } = helpers.processAssets(matchingOutput);
        return { [matchingOutput.payment_addr.bech32]: assets };
      }
      return {};
    }
  },
  NATIVE_SCRIPT_MINT: {
    name: "Native script mint",
    identify: (txData, rewardAddress) => {
      return helpers.hasNativeScriptMint(txData) &&
             !helpers.isPlutusContractPresent(txData) &&
             !helpers.hasCollateral(txData) &&
             txData.inputs.some(input => input.stake_addr === rewardAddress) &&
             helpers.findMatchingOutput(txData.outputs, rewardAddress);
    },
    process: (txData, rewardAddress) => {
      let addressAssets = {};
      
      // Find the output that matches our reward address (where we receive the newly minted tokens)
      const matchingOutputs = txData.outputs.filter(output => output.stake_addr === rewardAddress);
      
      matchingOutputs.forEach(output => {
        const { assets } = helpers.processNewlyMintedAssets(output, txData.assets_minted);
        if (assets.length > 0) {
          addressAssets[output.payment_addr.bech32] = assets;
        }
      });

      return addressAssets;
    }
  },
  TOKEN_BURN: {
    name: "Token burn",
    identify: (txData, rewardAddress) => {
      const allInputsAndOutputsMatchRewardAddress = 
        txData.inputs.every(input => input.stake_addr === rewardAddress) &&
        txData.outputs.every(output => output.stake_addr === rewardAddress);

      return helpers.hasTokensBurned(txData) &&
             allInputsAndOutputsMatchRewardAddress &&
             !helpers.isPlutusContractPresent(txData) &&
             !helpers.hasCollateral(txData) &&
             !helpers.hasNativeScriptMint(txData);
    },
    process: (txData, rewardAddress) => {
      let addressAssets = {};
      
      const { assets } = helpers.processBurnedAssets(txData);
      if (assets.length > 0) {
        // Use the first output's payment address as the key
        const outputAddress = txData.outputs[0].payment_addr.bech32;
        addressAssets[outputAddress] = assets;
      }

      return addressAssets;
    }
  },
};

// Main function to process transactions
export async function getTxDetails(rewardAddress, txData, tTypes) {
  console.log("getTxDetails", rewardAddress, txData, tTypes);

  let transactionType = "";
  let addressAssets = {};

  // Identify the transaction type
  for (const [type, handler] of Object.entries(transactionTypes)) {
    if (handler.identify(txData, rewardAddress)) {
      transactionType = handler.name;
      addressAssets = handler.process(txData, rewardAddress);
      break;
    }
  }

  // If no specific type was identified, process as an unknown type
  if (!transactionType) {
    transactionType = "Unknown";
    addressAssets = processUnknownTransaction(txData, rewardAddress);
  }

  return { addressAssets, transactionType };
}

// Helper function to process unknown transaction types
function processUnknownTransaction(txData, rewardAddress) {
  // Log relevant information for debugging
  console.log("Unknown transaction type:", rewardAddress, txData);
  console.log("Inputs:", txData.inputs);
  console.log("Outputs:", txData.outputs);
  console.log("Certificates:", txData.certificates);
  console.log("Assets minted:", txData.assets_minted);
  console.log("Withdrawals:", txData.withdrawals);
  console.log("Timestamp:", txData.tx_timestamp);
  console.log("Plutus contracts:", txData.plutus_contracts);
  console.log("Fee:", parseInt(txData.fee));
  
  return {};
}

// You can add more helper functions or transaction types here as needed
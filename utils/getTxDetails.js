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
  
  getAssetNameFromTTypes: (fingerprint, tTypes) => {
    const typeEntry = tTypes.find(tType => tType.fingerprint === fingerprint);
    return typeEntry ? typeEntry.asset_name : 'Unknown';
  },

  processAssetsExcludingAda: (output, assetIdCounter, tTypes) => {
    const assets = [];

    if (output.asset_list && output.asset_list.length > 0) {
      output.asset_list.forEach(asset => {
        const name = helpers.getAssetNameFromTTypes(asset.fingerprint, tTypes);
        const decimals = asset.decimals || 0;
        const amount = parseInt(asset.quantity) / Math.pow(10, decimals);
        assets.push({
          amount: amount.toFixed(decimals),
          decimals: decimals,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name: name,
          unit: `${asset.policy_id}.${asset.asset_name}`
        });
        assetIdCounter++;
      });
    }

    return { assets, assetIdCounter };
  },
  
  processAssets: (output, assetIdCounter, tTypes) => {
    const assets = [];
    const adaAmount = parseInt(output.value) / 1000000;
    
    assets.push({
      amount: adaAmount.toFixed(6),
      decimals: 6,
      fingerprint: "",
      id: assetIdCounter.toString(),
      name: "ADA",
      unit: "lovelace"
    });
    assetIdCounter++;

    if (output.asset_list && output.asset_list.length > 0) {
      output.asset_list.forEach(asset => {
        const name = helpers.getAssetNameFromTTypes(asset.fingerprint, tTypes);
        const decimals = asset.decimals || 0;
        const amount = parseInt(asset.quantity) / Math.pow(10, decimals);
        assets.push({
          amount: amount.toFixed(decimals),
          decimals: decimals,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name: name,
          unit: `${asset.policy_id}.${asset.asset_name}`
        });
        assetIdCounter++;
      });
    }

    return { assets, assetIdCounter };
  },
  
  processNewlyMintedAssets: (output, assetsMinted, tTypes, assetIdCounter) => {
    const assets = [];

    if (output.asset_list && output.asset_list.length > 0) {
      output.asset_list.forEach(asset => {
        const mintedAsset = assetsMinted.find(
          minted => minted.policy_id === asset.policy_id && minted.asset_name === asset.asset_name
        );

        if (mintedAsset) {
          const name = helpers.getAssetNameFromTTypes(asset.fingerprint, tTypes);
          const decimals = asset.decimals || 0;
          const amount = parseInt(asset.quantity) / Math.pow(10, decimals);
          assets.push({
            amount: amount.toFixed(decimals),
            decimals: decimals,
            fingerprint: asset.fingerprint || "",
            id: assetIdCounter.toString(),
            name: name,
            unit: `${asset.policy_id}.${asset.asset_name}`
          });
          assetIdCounter++;
        }
      });
    }

    return { assets, assetIdCounter };
  },
  
  processBurnedAssets: (txData, tTypes, assetIdCounter) => {
    const assets = [];

    txData.assets_minted.forEach(asset => {
      if (parseInt(asset.quantity) < 0) {
        const name = helpers.getAssetNameFromTTypes(asset.fingerprint, tTypes);
        const decimals = asset.decimals || 0;
        const amount = (parseInt(asset.quantity) * -1) / Math.pow(10, decimals);
        assets.push({
          amount: amount.toFixed(decimals),
          decimals: decimals,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name: name,
          unit: `${asset.policy_id}.${asset.asset_name}`
        });
        assetIdCounter++;
      }
    });

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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      // Process the matching output (newly minted tokens)
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssetsExcludingAda(matchingOutput, assetIdCounter, tTypes);
        if (assets.length > 0) {
          addressAssets[matchingOutput.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      }

      // Process outputs sent to different stake addresses
      txData.outputs.forEach(output => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          if (assets.length > 0) {
            addressAssets[output.payment_addr.bech32] = assets;
            assetIdCounter = newAssetIdCounter;
          }
        }
      });

      return { addressAssets, assetIdCounter };
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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      const inputs = txData.inputs;
      const outputs = txData.outputs;
      let addressAssets = {};

      const inputAddresses = new Set(inputs.map(input => input.payment_addr.bech32));

      outputs.forEach(output => {
        if (!inputAddresses.has(output.payment_addr.bech32)) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return { addressAssets, assetIdCounter };
    }
  },
  SMART_CONTRACT_TOKEN_RECEIPT: {
    name: "Smart contract token receipt",
    identify: (txData, rewardAddress) => {
      return helpers.isPlutusContractPresent(txData) &&
             helpers.findMatchingOutput(txData.outputs, rewardAddress) &&
             helpers.hasCollateral(txData);
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }
      return { addressAssets, assetIdCounter };
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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};

      txData.outputs.forEach(output => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return { addressAssets, assetIdCounter };
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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }
      return { addressAssets, assetIdCounter };
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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const matchingOutputs = txData.outputs.filter(output => output.stake_addr === rewardAddress);
      
      matchingOutputs.forEach(output => {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processNewlyMintedAssets(output, txData.assets_minted, tTypes, assetIdCounter);
        if (assets.length > 0) {
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return { addressAssets, assetIdCounter };
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
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const { assets, assetIdCounter: newAssetIdCounter } = helpers.processBurnedAssets(txData, tTypes, assetIdCounter);
      if (assets.length > 0) {
        const outputAddress = txData.outputs[0].payment_addr.bech32;
        addressAssets[outputAddress] = assets;
        assetIdCounter = newAssetIdCounter;
      }

      return { addressAssets, assetIdCounter };
    }
  },
  DREP_REGISTRATION: {
    name: "DRep Registration",
    identify: (txData, rewardAddress) => {
      return txData.certificates &&
             txData.certificates.some(cert => cert.type === "drep_registration") &&
             txData.deposit && 
             txData.outputs.some(output => output.stake_addr === rewardAddress);
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const drepRegistrationOutput = txData.outputs.find(output => output.stake_addr === rewardAddress);
      
      if (drepRegistrationOutput && txData.deposit) {
        const depositInAda = parseInt(txData.deposit) / 1000000; // Convert lovelace to ADA
        const lockedAda = {
          amount: depositInAda.toFixed(6),
          decimals: 6,
          fingerprint: "",
          id: assetIdCounter.toString(),
          name: "ADA",
          unit: "lovelace"
        };
        
        addressAssets[drepRegistrationOutput.payment_addr.bech32] = [lockedAda];
        assetIdCounter++;
      }

      return { addressAssets, assetIdCounter };
    }
  },
  VOTE_DELEGATION: {
    name: "Vote Delegation",
    identify: (txData, rewardAddress) => {
      return txData.certificates &&
             txData.certificates.some(cert => cert.type === "vote_delegation") &&
             txData.withdrawals &&
             txData.withdrawals.some(withdrawal => withdrawal.stake_addr === rewardAddress);
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const withdrawal = txData.withdrawals.find(withdrawal => withdrawal.stake_addr === rewardAddress);
      
      if (withdrawal) {
        const withdrawalInAda = parseInt(withdrawal.amount) / 1000000; // Convert lovelace to ADA
        const withdrawnAda = {
          amount: withdrawalInAda.toFixed(6),
          decimals: 6,
          fingerprint: "",
          id: assetIdCounter.toString(),
          name: "ADA",
          unit: "lovelace"
        };
        
        // Use the first output's payment address as the receiving address for the withdrawal
        const receiveAddress = txData.outputs[0].payment_addr.bech32;
        addressAssets[receiveAddress] = [withdrawnAda];
        assetIdCounter++;
      }

      return { addressAssets, assetIdCounter };
    }
  },
  STAKE_REWARD_WITHDRAWAL: {
    name: "Stake Reward Withdrawal",
    identify: (txData, rewardAddress) => {
      return txData.withdrawals &&
             txData.withdrawals.length > 0 &&
             txData.withdrawals[0].stake_addr === rewardAddress &&
             txData.certificates.length === 0 &&
             txData.inputs.length === 1 &&
             txData.outputs.length === 1 &&
             txData.inputs[0].stake_addr === txData.outputs[0].stake_addr &&
             txData.inputs[0].stake_addr === rewardAddress;
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const withdrawal = txData.withdrawals[0];
      
      if (withdrawal) {
        const withdrawalInAda = parseInt(withdrawal.amount) / 1000000; // Convert lovelace to ADA
        const withdrawnAda = {
          amount: withdrawalInAda.toFixed(6),
          decimals: 6,
          fingerprint: "",
          id: assetIdCounter.toString(),
          name: "ADA",
          unit: "lovelace"
        };
        
        // Use the output's payment address as the receiving address for the withdrawal
        const receiveAddress = txData.outputs[0].payment_addr.bech32;
        addressAssets[receiveAddress] = [withdrawnAda];
        assetIdCounter++;
      }

      return { addressAssets, assetIdCounter };
    }
  },
};

// Main function to process transactions
export async function getTxDetails(rewardAddress, txData, tTypes) {
  console.log("getTxDetails", rewardAddress, txData, tTypes);

  let transactionType = "";
  let addressAssets = {};
  let assetIdCounter = 1;

  // Identify the transaction type
  for (const [type, handler] of Object.entries(transactionTypes)) {
    if (handler.identify(txData, rewardAddress)) {
      transactionType = handler.name;
      const result = handler.process(txData, rewardAddress, tTypes, assetIdCounter);
      addressAssets = result.addressAssets;
      assetIdCounter = result.assetIdCounter;
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
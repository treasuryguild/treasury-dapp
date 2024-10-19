// Helper functions
const helpers = {
  isPlutusContractPresent: (txData) => txData.plutus_contracts?.length > 0,
  hasCollateral: (txData) => txData.collateral_inputs?.length > 0 && txData.collateral_output,
  findMatchingOutput: (outputs, rewardAddress) => outputs.find(output => output.stake_addr === rewardAddress),
  hasAssetsMinted: (txData) => txData.assets_minted?.length > 0,
  hasNativeScriptMint: (txData) => txData.native_scripts?.length > 0 && txData.assets_minted?.length > 0,
  hasTokensBurned: (txData) => txData.assets_minted?.some(asset => parseInt(asset.quantity) < 0),

  getAssetNameFromTTypes: (fingerprint, tTypes) => {
    const typeEntry = tTypes.find(tType => tType.fingerprint === fingerprint);
    return typeEntry ? typeEntry.asset_name : 'Unknown';
  },

  processAssets: (output, assetIdCounter, tTypes, includeAda = true) => {
    const assets = [];
    if (includeAda) {
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
    }

    if (output.asset_list?.length > 0) {
      output.asset_list.forEach(asset => {
        const name = helpers.getAssetNameFromTTypes(asset.fingerprint, tTypes);
        const decimals = asset.decimals || 0;
        const amount = parseInt(asset.quantity) / Math.pow(10, decimals);
        assets.push({
          amount: amount.toFixed(decimals),
          decimals,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name,
          unit: `${asset.policy_id}.${asset.asset_name}`
        });
        assetIdCounter++;
      });
    }

    return { assets, assetIdCounter };
  },

  processNewlyMintedAssets: (output, assetsMinted, tTypes, assetIdCounter) => {
    const assets = [];

    output.asset_list?.forEach(asset => {
      const mintedAsset = assetsMinted.find(
        minted => minted.policy_id === asset.policy_id && minted.asset_name === asset.asset_name
      );

      if (mintedAsset) {
        const { assets: newAssets, assetIdCounter: newCounter } = helpers.processAssets(
          { asset_list: [asset] },
          assetIdCounter,
          tTypes,
          false
        );
        assets.push(...newAssets);
        assetIdCounter = newCounter;
      }
    });

    return { assets, assetIdCounter };
  },

  processBurnedAssets: (txData, tTypes, assetIdCounter) => {
    const assets = [];

    txData.assets_minted.forEach(asset => {
      if (parseInt(asset.quantity) < 0) {
        const { assets: newAssets, assetIdCounter: newCounter } = helpers.processAssets(
          { asset_list: [{ ...asset, quantity: (-parseInt(asset.quantity)).toString() }] },
          assetIdCounter,
          tTypes,
          false
        );
        assets.push(...newAssets);
        assetIdCounter = newCounter;
      }
    });

    return { assets, assetIdCounter };
  },

  processWithdrawal: (withdrawal, assetIdCounter) => {
    const withdrawalInAda = parseInt(withdrawal.amount) / 1000000;
    return {
      withdrawnAda: {
        amount: withdrawalInAda.toFixed(6),
        decimals: 6,
        fingerprint: "",
        id: assetIdCounter.toString(),
        name: "ADA",
        unit: "lovelace"
      },
      newAssetIdCounter: assetIdCounter + 1
    };
  },

  addAssetToAddressAssets: (addressAssets, address, asset) => {
    if (addressAssets[address]) {
      addressAssets[address].push(asset);
    } else {
      addressAssets[address] = [asset];
    }
  },

  processWithdrawalsForAddress: (txData, rewardAddress, addressAssets, assetIdCounter) => {
    const withdrawal = txData.withdrawals?.find(w => w.stake_addr === rewardAddress);
    if (withdrawal) {
      const { withdrawnAda, newAssetIdCounter } = helpers.processWithdrawal(withdrawal, assetIdCounter);
      const matchingOutput = txData.outputs.find(output => output.stake_addr === rewardAddress);
      if (matchingOutput) {
        const receiveAddress = matchingOutput.payment_addr.bech32;
        helpers.addAssetToAddressAssets(addressAssets, receiveAddress, withdrawnAda);
        assetIdCounter = newAssetIdCounter;
      }
    }
    return { addressAssets, assetIdCounter };
  }
};

const transactionTypes = {
  SMART_CONTRACT_MINT: {
    name: "Smart contract mint",
    identify: (txData, rewardAddress) => 
      helpers.isPlutusContractPresent(txData) &&
      helpers.hasCollateral(txData) &&
      helpers.hasAssetsMinted(txData) &&
      txData.inputs.some(input => input.stake_addr === rewardAddress) &&
      helpers.findMatchingOutput(txData.outputs, rewardAddress),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(matchingOutput, assetIdCounter, tTypes, false);
        if (assets.length > 0) {
          addressAssets[matchingOutput.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      }

      txData.outputs.forEach(output => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          if (assets.length > 0) {
            addressAssets[output.payment_addr.bech32] = assets;
            assetIdCounter = newAssetIdCounter;
          }
        }
      });

      return helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter);
    }
  },
  TOKEN_SWAP: {
    name: "Token swap request",
    identify: (txData, rewardAddress) => {
      const allInputsMatchRewardAddress = txData.inputs.every(input => input.stake_addr === rewardAddress);
      const swapOutput = txData.outputs.find(output => 
        output.datum_hash !== null && 
        (output.stake_addr === null || output.stake_addr !== rewardAddress)
      );
      const noVoteDelegation = !txData.certificates.some(cert => cert.type === "vote_delegation");
      return allInputsMatchRewardAddress && swapOutput && noVoteDelegation;
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      const inputAddresses = new Set(txData.inputs.map(input => input.payment_addr.bech32));
      let addressAssets = {};

      txData.outputs.forEach(output => {
        if (!inputAddresses.has(output.payment_addr.bech32)) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter);
    }
  },
  SMART_CONTRACT_TOKEN_RECEIPT: {
    name: "Smart contract token receipt",
    identify: (txData, rewardAddress) => 
      helpers.isPlutusContractPresent(txData) &&
      helpers.findMatchingOutput(txData.outputs, rewardAddress) &&
      helpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }

      return helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter);
    }
  },
  MULTI_SEND: {
    name: "Multi-send",
    identify: (txData, rewardAddress) => 
      txData.inputs.every(input => input.stake_addr === rewardAddress) &&
      txData.outputs.some(output => output.stake_addr !== rewardAddress) &&
      !helpers.isPlutusContractPresent(txData) &&
      !helpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};

      txData.outputs.forEach(output => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });

      return helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter);
    }
  },
  TOKEN_RECEIVE: {
    name: "Token receive",
    identify: (txData, rewardAddress) => 
      txData.inputs.every(input => input.stake_addr !== rewardAddress) &&
      txData.outputs.some(output => output.stake_addr === rewardAddress) &&
      !helpers.isPlutusContractPresent(txData) &&
      !helpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      const matchingOutput = helpers.findMatchingOutput(txData.outputs, rewardAddress);
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } = helpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }

      return helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter);
    }
  },
  NATIVE_SCRIPT_MINT: {
    name: "Native script mint",
    identify: (txData, rewardAddress) => 
      helpers.hasNativeScriptMint(txData) &&
      !helpers.isPlutusContractPresent(txData) &&
      !helpers.hasCollateral(txData) &&
      txData.inputs.some(input => input.stake_addr === rewardAddress) &&
      helpers.findMatchingOutput(txData.outputs, rewardAddress),
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
    identify: (txData, rewardAddress) => 
      helpers.hasTokensBurned(txData) &&
      txData.inputs.every(input => input.stake_addr === rewardAddress) &&
      txData.outputs.every(output => output.stake_addr === rewardAddress) &&
      !helpers.isPlutusContractPresent(txData) &&
      !helpers.hasCollateral(txData) &&
      !helpers.hasNativeScriptMint(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      const { assets, assetIdCounter: newAssetIdCounter } = helpers.processBurnedAssets(txData, tTypes, assetIdCounter);
      const addressAssets = assets.length > 0 ? { [txData.outputs[0].payment_addr.bech32]: assets } : {};
      return { addressAssets, assetIdCounter: newAssetIdCounter };
    }
  },
  DREP_REGISTRATION: {
    name: "DRep Registration",
    identify: (txData, rewardAddress) => 
      txData.certificates?.some(cert => cert.type === "drep_registration") &&
      txData.deposit && 
      txData.outputs.some(output => output.stake_addr === rewardAddress),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets = {};
      
      const drepRegistrationOutput = txData.outputs.find(output => output.stake_addr === rewardAddress);
      
      if (drepRegistrationOutput && txData.deposit) {
        const depositInAda = parseInt(txData.deposit) / 1000000;
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
      
      // Process withdrawals using the new helper function
      ({ addressAssets, assetIdCounter } = helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter));

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
      
      // Process withdrawals using the new helper function
      ({ addressAssets, assetIdCounter } = helpers.processWithdrawalsForAddress(txData, rewardAddress, addressAssets, assetIdCounter));

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
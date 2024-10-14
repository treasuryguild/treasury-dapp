export async function getTxDetails(rewardAddress, txData, assets, tTypes) {
  const inputs = txData.inputs;
  const outputs = txData.outputs;
  const certificates = txData.certificates;
  const assets_minted = txData.assets_minted;
  const withdrawals = txData.withdrawals;
  console.log("getTxDetails", rewardAddress, txData, assets, tTypes);
  console.log("inputs", inputs);
  console.log("outputs", outputs);
  console.log("certificates", certificates);
  console.log("assets_minted", assets_minted);
  console.log("withdrawals", withdrawals);
  let addressAssets = {};
  let transactionType = "";
  
  //console.log("addressAssets, transactionType", addressAssets, transactionType)
  return { addressAssets, transactionType };
}

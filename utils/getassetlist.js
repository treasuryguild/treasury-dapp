import axios from "axios";

function mapAssetData(assetDetails, assetList) {
    return assetDetails.map((asset, index) => {
        const matchingAsset = assetList.find(listAsset => listAsset.fingerprint === asset.fingerprint);
        const name = asset.token_registry_metadata && asset.token_registry_metadata.ticker 
                       ? asset.token_registry_metadata.ticker 
                       : asset.asset_name_ascii;
        const tokenType = Number(asset.total_supply) > 1 ? 'fungible' : 'nft';
        return {
            id: String(index + 1),
            name: name,
            amount: (Number(matchingAsset.quantity) / Math.pow(10, matchingAsset.decimals)).toFixed(matchingAsset.decimals),
            unit: `${matchingAsset.policy_id}${matchingAsset.asset_name}`,
            fingerprint: asset.fingerprint,
            decimals: matchingAsset.decimals,
            tokenType: tokenType
        };
    });
}


export async function getAssetList(wallet) {
    async function getList() {
        const url = "https://api.koios.rest/api/v0/address_assets";
        const data = {
          _addresses: [wallet],
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        //console.log(response.data)
        return response.data;
    }

    function transformArray(assetList) {
        return assetList.map(asset => [asset.policy_id, asset.asset_name]);
    }

    async function getAssetDetails(transformedArray) {
        const url = "https://api.koios.rest/api/v0/asset_info?select=fingerprint,asset_name_ascii,total_supply,token_registry_metadata";
        const data = {
          _asset_list: transformedArray,
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        //console.log(response.data)
        return response.data;
    }

    let list = await getList();
    let transformedArray = transformArray(list[0].asset_list);
    let assetDetails = await getAssetDetails(transformedArray);
    let mappedAssetData = mapAssetData(assetDetails, list[0].asset_list);
    console.log("mappedAssetData", mappedAssetData);
    console.log("transformedArray",transformedArray);
    console.log("assetDetails", assetDetails);

    return list;
}
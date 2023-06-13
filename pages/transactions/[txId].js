import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '@meshsdk/react';
import { getTxInfo } from '../../utils/getTxInfo';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';

function Txid() {
  const router = useRouter();
  const { txId } = router.query;
  const { connected, wallet } = useWallet();

  const [addressAssets, setAddressAssets] = useState({});
  const [labelOptions, setLabelOptions] = useState([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: 'Content Creation', label: 'Content Creation' },
  ]);

  useEffect(() => {
    if (connected) {
      checkTransactionType();
    }
  }, [connected]);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (address, name, value) => {
    setAddressAssets({
      ...addressAssets,
      [address]: {
        ...addressAssets[address],
        [name]: value,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(addressAssets);
  };

  async function checkTransactionType() {
    if (connected) {
      const usedAddresses = await wallet.getUsedAddresses();
      const assets = await wallet.getAssets();
      const txData = await koiosFetch();
      const addressAssetsData = await getTxInfo(usedAddresses, txData[0], assets);
      setAddressAssets(
        Object.fromEntries(
          Object.entries(addressAssetsData).map(([address, tokens]) => [
            address,
            {
              tokens,
              description: '',
              selectedLabels: [],
              userDefinedLabels: [],
            },
          ])
        )
      );
    }
  }

  async function koiosFetch() {
    const url = "https://api.koios.rest/api/v0/tx_info";
    const data = {
      _tx_hashes: [txId],
    };

    const response = await axios.post(url, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(addressAssets).map(([address, data], index) => (
        <div key={address}>
          <h3>Address: ...{address.slice(-6)}</h3>
          {data.tokens.map((token, tokenIndex) => (
            <p key={tokenIndex}>
              {token.name}: {token.amount}
            </p>
          ))}
          <CreatableSelect
            isMulti
            options={[...labelOptions]}
            value={data.selectedLabels}
            onChange={(selected) => {
              handleInputChange(address, 'selectedLabels', selected || []);
            }}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? 'grey' : 'white',
                backgroundColor: 'black',
                color: 'white',
              }),
              option: (baseStyles, { isFocused, isSelected }) => ({
                ...baseStyles,
                backgroundColor: isSelected ? 'darkblue' : isFocused ? 'darkgray' : 'black',
                color: 'white',
              }),
              multiValue: (baseStyles) => ({
                ...baseStyles,
                backgroundColor: 'darkblue',
              }),
              multiValueLabel: (baseStyles) => ({
                ...baseStyles,
                color: 'white',
              }),
              input: (baseStyles) => ({
                ...baseStyles,
                color: 'white',
              }),
              menu: (baseStyles) => ({
                ...baseStyles,
                backgroundColor: 'black',
              }),
            }}
          />
          <label>
            Description:
            <textarea
              name="description"
              value={data.description}
              onChange={(e) => handleInputChange(address, 'description', e.target.value)}
            />
          </label>
        </div>
      ))}
      <button type="submit">Update</button>
    </form>
  );
}

export default Txid;

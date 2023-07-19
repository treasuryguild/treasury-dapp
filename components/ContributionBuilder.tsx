import React, { useState, useEffect } from 'react';
import styles from '../styles/TxBuilder.module.css';
import ReactSelect from 'react-select';
import { useRouter } from 'next/router';

type Contributor = Record<string, Partial<Record<Tokens, string>>>;
export type Contribution = {
  taskCreator: string[];
  name: string[];
  label: string[];
  contributors: Contributor;
};

type OptionsType = Array<{value: string, label: string}>;
type OptionType = {
  value: string;
  label: string;
};
type ValueType = ReadonlyArray<OptionType> | null;

type Tokens = string;

export type ContributionBuilderProps = {
  executeTransaction: (
      assetsPerAddress: any,
      adaPerAddress: any,
      metaData: any
    ) => Promise<string>;
  onContributionsUpdate: (contributions: Contribution[]) => void;
  onContributorWalletsUpdate: (contributorWallets: any[]) => void;
  myVariable: any;
  walletTokens: any;
  labels: any;
  tokenRates: any;
};

const contributorWallets: any[] = []

const ContributionBuilder: React.FC<ContributionBuilderProps> = ({
  executeTransaction,
  onContributionsUpdate,
  onContributorWalletsUpdate,
  myVariable,
  walletTokens,
  tokenRates,
  labels,
  }) => {
  const tokensList: Tokens[] = walletTokens.map((token: any) => token.name);
  const [contributorWallets, setContributorWallets] = useState<any[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([{
    taskCreator: [myVariable.group],
    name: [],
    label: [],
    contributors: {},
  }]);
  const [labelOptions, setLabelOptions] = useState<OptionsType>(labels);
  const [selectedLabels, setSelectedLabels] = useState<Array<ValueType>>([[]]);
  const [userDefinedLabels, setUserDefinedLabels] = useState<OptionsType>([]);

  const router = useRouter();

  useEffect(() => {
    onContributionsUpdate(contributions);
  }, [contributions]);

  useEffect(() => {
    onContributorWalletsUpdate(contributorWallets);
  }, [contributorWallets]);

  const addContribution = () => {
    setContributions([
      ...contributions,
      {
        taskCreator: [myVariable.group],
        name: [],
        label: [],
        contributors: {},
      },
    ]);
    setSelectedLabels([...selectedLabels, []]); // add an empty array for the new contribution
  };

  const removeContribution = (index: number) => {
    const newContributions = [...contributions];
    newContributions.splice(index, 1);
    setContributions(newContributions);
    const newSelectedLabels = [...selectedLabels];
    newSelectedLabels.splice(index, 1);
    setSelectedLabels(newSelectedLabels);
  };

  const updateName = (index: number, name: string) => {
    const newContributions = [...contributions];
    let parts = [];
    let currentPart = '';
    name.split(' ').forEach(word => {
      const potentialPart = currentPart ? currentPart + ' ' + word : word;
      if (potentialPart.length > 50) {
        if (currentPart.length === 50) {
          parts.push(currentPart + ' ');
        } else {
          parts.push(currentPart);
        }
        currentPart = word;
      } else {
        currentPart = potentialPart;
      }
    });
    if (currentPart) {
      parts.push(currentPart);
    }
    newContributions[index].name = parts;
    setContributions(newContributions);
  };

  const updateLabel = (index: number, label: string) => {
    const newSelectedLabels = [...selectedLabels];
    newSelectedLabels[index] = label.split(',').map((value) => ({ value, label: value }));
    setSelectedLabels(newSelectedLabels);
    const newContributions = [...contributions];
    newContributions[index].label = label.split(',');
    setContributions(newContributions);
  };

  const addContributor = (index: number, contributorId: string) => {
    const newContributions = [...contributions];
    let contributorWalletId: any
    contributorWalletId = contributorId.slice(-6)
    if (!contributorWallets.includes(contributorId)) {
      setContributorWallets([...contributorWallets, contributorId]);
    }
    // Set the default token to 'ADA' with an empty value
    newContributions[index].contributors[contributorWalletId] = { ADA: "" };
    setContributions(newContributions);
  };

  const getWalletValue = (contributorId: string) => {
    const wallet = contributorWallets.find(wallet => wallet.slice(-6) === contributorId);
    return wallet || '';
  };

  const removeContributor = (index: number, contributorId: string) => {
    const newContributions = [...contributions];
    delete newContributions[index].contributors[contributorId];
    setContributions(newContributions);
  };

  const addToken = (
    contributionIndex: number,
    contributorId: string,
    token: Tokens,
    amount: string
  ) => {
    const newContributions = [...contributions];
    newContributions[contributionIndex].contributors[contributorId][token] = amount;
    setContributions(newContributions);
  };

  const updateTokenAmount = (
    contributionIndex: number,
    contributorId: string,
    token: Tokens,
    amount: string
  ) => {
    const newContributions = [...contributions];
    newContributions[contributionIndex].contributors[contributorId][token] = amount;
    setContributions(newContributions);
  };

  const removeToken = (
    contributionIndex: number,
    contributorId: string,
    token: Tokens
  ) => {
    const newContributions = [...contributions];
    delete newContributions[contributionIndex].contributors[contributorId][token];
    setContributions(newContributions);
  };

  function aggregateTokens(data: Contribution[]): { [token: string]: string } {
    const result: { [token: string]: number } = {};
  
    data.forEach((item) => {
      const contributors = item.contributors;
  
      for (const userId in contributors) {
        const userTokens = contributors[userId];
  
        for (const token in userTokens) {
          if (typeof userTokens[token] === 'string') {
            const tokenValue = parseFloat(userTokens[token]!);
  
            if (result[token]) {
              result[token] += tokenValue;
            } else {
              result[token] = tokenValue;
            }
          }
        }
      }
    });
  
    // Format the numbers to the desired precision and return as an object with string values
    const formattedResult: { [token: string]: string } = {};
    for (const token in result) {
      formattedResult[token] = result[token].toFixed(2);
    }
  
    return formattedResult;
  }

  async function getTotalTokens(aggregatedTokens: {} | any) {
    let totalTokensPrep = ""
    for (let i in aggregatedTokens) {
        let gmblNumber: any
        let gmblNumber2: any
        gmblNumber = parseFloat(aggregatedTokens[i])
        gmblNumber2 = (gmblNumber * tokenRates[i]).toFixed(3)
        totalTokensPrep = `${totalTokensPrep}
      "${gmblNumber2} USD in ${aggregatedTokens[i]} ${i}",`
    }
    return totalTokensPrep;
  }

  async function getValues(contributionsJSON: string, contributorWalletsJSON: string) {
    let totalTokens: any;
    let assetsPerAddress: any;
    const adaPerAddress: { [address: string]: Asset[] } = {};
    let metaData: any;
    let contJson: any;
    let walletsArray: any;
    const adaPerAddressString: { [address: string]: AssetString[] } = {};
    assetsPerAddress = {}
    contJson = JSON.parse(contributionsJSON)
    walletsArray = JSON.parse(contributorWalletsJSON)

    interface ContributorTokens {
      [tokenName: string]: number;
    }
    
    interface Asset {
      unit: string;
      quantity: number;
    }

    interface AssetString {
      unit: string;
      quantity: string;
  }
    
    for (const content of contJson) {
      for (const [contributorAddress, tokens] of Object.entries<ContributorTokens>(content.contributors)) {
        for (const walletAddress of walletsArray) {
          if (walletAddress.includes(contributorAddress)) {
            if (!assetsPerAddress[walletAddress]) {
              assetsPerAddress[walletAddress] = [];
            }
    
            for (const walletToken of walletTokens) {
              const tokenName = walletToken.name;
            
              if (tokens.hasOwnProperty(tokenName)) {
                const value = parseFloat(tokens[tokenName].toString()) * Math.pow(10, walletToken.decimals);
            
                if (walletToken.unit === 'lovelace') {
                  if (!adaPerAddress[walletAddress]) {
                    adaPerAddress[walletAddress] = [];
                  }
            
                  const existingAdaAsset = adaPerAddress[walletAddress].find(
                    (asset: Asset) => asset.unit === 'lovelace'
                  );
            
                  if (existingAdaAsset) {
                    existingAdaAsset.quantity += value;
                  } else {
                    adaPerAddress[walletAddress].push({
                      unit: 'lovelace',
                      quantity: value,
                    });
                  }
                } else {
                  const existingAsset = assetsPerAddress[walletAddress].find(
                    (asset: Asset) => asset.unit === walletToken.unit
                  );
            
                  if (existingAsset) {
                    existingAsset.quantity += value;
                  } else {
                    assetsPerAddress[walletAddress].push({
                      unit: walletToken.unit,
                      quantity: value,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    for (const [address, adaAssets] of Object.entries(adaPerAddress)) {
      adaPerAddressString[address] = [];
  
      for (const adaAsset of adaAssets) {
          if (adaAsset.quantity > 0) {
              adaPerAddressString[address].push({
                  unit: adaAsset.unit,
                  quantity: adaAsset.quantity.toString(),
              });
          }
      }
    }
    for (const walletAddress in assetsPerAddress) {
      assetsPerAddress[walletAddress] = assetsPerAddress[walletAddress].map((asset: Asset) => {
        return {
          unit: asset.unit,
          quantity: asset.quantity.toString(),
        };
      });
    }

    const aggregatedTokens = aggregateTokens(contributions);
    totalTokens = await getTotalTokens(aggregatedTokens);

    console.log("aggregatedTokens",aggregatedTokens)
    metaData = `{
      "mdVersion": ["1.4"],
      "msg": [
      "${myVariable.project} Transaction",
      "Website: ${myVariable.project_website}",
      "Recipients: ${walletsArray.length}",${totalTokens}
      "Transaction made by Treasury Guild @${tokenRates['ADA']}",
      "https://www.treasuryguild.io/"
      ],
      "contributions": ${contributionsJSON}
      }
      `
      let finalMetaData = {}
      finalMetaData = JSON.parse(metaData)
    let thash = await executeTransaction(assetsPerAddress, adaPerAddressString, finalMetaData)
  }

  const handleClick = async () => {
    const contributionsJSON = JSON.stringify(contributions);
    const contributorWalletsJSON = JSON.stringify(contributorWallets);
    await getValues(contributionsJSON, contributorWalletsJSON);
  };

  return (
    <div>
      {contributions.map((contribution, index) => (
        <div  className={styles.contributionBox} key={index}>
          <div className={styles.contributionHead}>
            <h2>Contribution {index + 1}</h2>
            <button className={styles.contributionButton} onClick={() => removeContribution(index)}>X</button>
          </div> 
          <div className={styles.contributionBody}>
              Labels:
              <ReactSelect
                isMulti
                options={[...labelOptions, ...userDefinedLabels]}
                value={selectedLabels[index]}
                onChange={(selected) => {
                  const newSelectedLabels = [...selectedLabels];
                  newSelectedLabels[index] = selected;
                  setSelectedLabels(newSelectedLabels);
                  updateLabel(index, selected.map((option) => option.value).join(','));
                }}
                onInputChange={(input) => {
                  setUserDefinedLabels(
                    input
                      ? input
                          .split(',')
                          .map((label) => label.trim())
                          .filter((label) => label)
                          .map((label) => ({ value: label, label }))
                      : []
                  );
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
                    backgroundColor: 'darkblue', // modify background color of selected label in the input field
                  }),
                  multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: 'white', // modify text color of selected label in the input field
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: 'white',
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: 'black', // Changed dropdown background color to dark
                  }),
                }}
              />
            <br />
              Description:
              <textarea
                style={{ height: '50px', padding: '0.5em' }}
                value={contribution.name.join(' ')} // modify join method to use spaces instead of commas
                onChange={(e) => updateName(index, e.target.value)}
              />
          </div>
          <br />
          {Object.keys(contribution.contributors).map((contributorId) => (
            <div className={styles.contributor} key={contributorId}>
              <div className={styles.contributorHead}>
                <h3>Contributor ID: {contributorId}</h3>
                <button className={styles.contributionButton} onClick={() => removeContributor(index, contributorId)}>
                  X
                </button>
              </div>
              <p style={{ fontSize: 'smaller' }}>wallet: {getWalletValue(contributorId)}</p>
              <br />
              <div className={styles.contributorBody}>
              <div className={styles.contributorTokenButtons}>
                {tokensList.map(token => (
                  <button key={token} onClick={() => addToken(index, contributorId, token, '')}>
                    + {token}
                  </button>
                ))}
              </div>
                <div>
                  {Object.entries(contribution.contributors[contributorId]).map(([token, amount]) => (
                    <div className={styles.contributorToken} key={token}>
                      <label>
                        {token} &nbsp;
                        <input
                          style={{ width: '100px', padding: '0.2em'}}
                          type="text"
                          value={amount}
                          onChange={(e) =>
                            updateTokenAmount(index, contributorId, token as Tokens, String(e.target.value))
                          }
                        />
                      </label>
                      <button style={{ backgroundColor: 'grey'}} onClick={() => removeToken(index, contributorId, token as Tokens)}>
                      &nbsp;-&nbsp;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className={styles.addContributor}>
            To add contributor enter wallet address and hit ENTER:
            <input
              type="text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addContributor(index, e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>  
        </div>
      ))}
      <button className={styles.addContributionButton} onClick={addContribution}>Add Contribution</button>
      {/*<pre>{JSON.stringify(contributions, null, 2)}</pre>*/}
      {Object.keys(tokenRates).length !== 0 && (<button className={styles.executeTxButton} onClick={handleClick}>Execute Transaction</button>)}
    </div>
  );
};

export default ContributionBuilder;
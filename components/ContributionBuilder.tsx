import React, { useState, useEffect } from 'react';
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/TxBuilder.module.css';
import { setLabels } from '../utils/setLabels'
import { setSubGroups } from '../utils/setSubGroups'
import ReactSelect from 'react-select';
import { useRouter } from 'next/router';

type Contributor = Record<string, Partial<Record<Tokens, string>>>;
export type Contribution = {
  taskCreator: string[];
  name: string[];
  arrayMap: {label: string[], subGroup: string[], date: string[], proof: string[]},
  //label: string[];
  contributors: Contributor;
};

type OptionsType = Array<{value: string, label: string}>;
type OptionsType2 = Array<{value: string, label: string}>;

type OptionType = {
  value: string;
  label: string;
};
type OptionType2 = {
  value: string;
  label: string;
};
type ValueType = ReadonlyArray<OptionType> | null;
type ValueType2 = ReadonlyArray<OptionType2> | null;

type Tokens = string;

export type ContributionBuilderProps = {
  executeTransaction: (
      assetsPerAddress: any,
      adaPerAddress: any,
      metaData: any
    ) => Promise<string>;
  onContributionsUpdate: (contributions: Contribution[]) => void;
  onContributorWalletsUpdate: (contributorWallets: any[]) => void;
  walletTokens: any;
  labels: any;
  subGroups: any;
  tokenRates: any;
};

const contributorWallets: any[] = []
const today = new Date();
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
const year = String(today.getFullYear()).slice(-2);
const formattedDate = `${day}.${month}.${year}`;

const ContributionBuilder: React.FC<ContributionBuilderProps> = ({
  executeTransaction,
  onContributionsUpdate,
  onContributorWalletsUpdate,
  walletTokens,
  tokenRates,
  labels,
  subGroups,
  }) => {
  const { myVariable, setMyVariable } = useMyVariable();
  const tokensList: Tokens[] = walletTokens.map((token: any) => token.name);
  const [contributorWallets, setContributorWallets] = useState<any[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([{
    taskCreator: [myVariable.group],
    name: [],
    arrayMap: {label:[], subGroup:[], date:[formattedDate], proof:[]},
    //label: [],
    contributors: {},
  }]);
  const [labelOptions, setLabelOptions] = useState<OptionsType>(labels);
  const [selectedLabels, setSelectedLabels] = useState<Array<ValueType>>([[]]);
  const [userDefinedLabels, setUserDefinedLabels] = useState<OptionsType>([]);

  const [subGroupOptions, setSubGroupOptions] = useState<OptionsType2>(subGroups);
  const [selectedSubGroup, setSelectedSubGroup] = useState<Array<ValueType2>>([[]]);
  const [userDefinedSubGroup, setUserDefinedSubGroup] = useState<OptionsType2>([]);
  

  const router = useRouter();

  useEffect(() => {
    onContributionsUpdate(contributions);
  }, [contributions]);

  useEffect(() => {
    onContributorWalletsUpdate(contributorWallets);
  }, [contributorWallets]);

  const [tokenDisplayNames, setTokenDisplayNames] = useState<any>({});

useEffect(() => {
  // create a mapping of token names to display names
  const newTokenDisplayNames = walletTokens.reduce((map: any, token: any) => {
    map[token.name] = token.displayname;
    return map;
  }, {});
  setTokenDisplayNames(newTokenDisplayNames);
}, [walletTokens]);

  const addContribution = () => {

    setContributions([
      ...contributions,
      {
        taskCreator: [myVariable.group],
        name: [],
        arrayMap: {label:[], subGroup:[], date:[formattedDate], proof:[]},
        //label: [],
        contributors: {},
      },
    ]);
    setSelectedLabels([...selectedLabels, []]); // add an empty array for the new contribution
    setSelectedSubGroup([...selectedSubGroup, []]);
  };

  const removeContribution = (index: number) => {
    const newContributions = [...contributions];
    newContributions.splice(index, 1);
    setContributions(newContributions);
    const newSelectedLabels = [...selectedLabels];
    newSelectedLabels.splice(index, 1);
    const newSelectedSubGroup = [...selectedSubGroup];
    newSelectedSubGroup.splice(index, 1);
    setSelectedLabels(newSelectedLabels);
    setSelectedSubGroup(newSelectedSubGroup);
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

  const updateProof = (index: number, proof: string) => {
    const newContributions = [...contributions];
    let parts = [];
    let currentPart = '';
    
    // Check if the string has spaces
    if (proof.includes(' ')) {
      // Split by spaces
      proof.split(' ').forEach(word => {
        const potentialPart = currentPart ? currentPart + ' ' + word : word;
        if (potentialPart.length > 50) {
          parts.push(currentPart);
          currentPart = word;
        } else {
          currentPart = potentialPart;
        }
      });
    } else {
      // Split into 50-character chunks
      let charCount = 0;
      for (let i = 0; i < proof.length; i++) {
        currentPart += proof[i];
        charCount++;
  
        if (charCount >= 50) {
          parts.push(currentPart);
          currentPart = '';
          charCount = 0;
        }
      }
    }
  
    // Append any remaining part
    if (currentPart) {
      parts.push(currentPart);
    }
  
    newContributions[index].arrayMap.proof = parts;
    setContributions(newContributions);
  };  

  const convertToISOFormat = (date: string | null) => {
    if (!date) {
      return '';  // or return null, depending on how you want to handle this case
    }
    const [day, month, year] = date.split('.');
    return `20${year}-${month}-${day}`;
  };  

  const updateDate = (index: number, date: string) => {
    const newContributions = [...contributions];
    
    let formattedDate = "";
    
    if (!date) {
      // Get today's date in yyyy-mm-dd format
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const year = String(today.getFullYear()).slice(-2);
      formattedDate = `${day}.${month}.${year}`;
    } else {
      // Convert to JavaScript Date object
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const year = String(dateObj.getFullYear()).slice(-2); // Get the last 2 digits
      formattedDate = `${day}.${month}.${year}`;
    }
  
    newContributions[index].arrayMap.date = [formattedDate];
    setContributions(newContributions);
  };

  const updateLabel = (index: number, label: string) => {
    const newSelectedLabels = [...selectedLabels];
    newSelectedLabels[index] = label.split(',').map((value) => ({ value, label: value }));
    setSelectedLabels(newSelectedLabels);
    const newContributions = [...contributions];
    newContributions[index].arrayMap.label = label.split(',');
    setContributions(newContributions);
    const status = setLabels(label.split(','));
    //console.log("Updating Label", label.split(','), status)
  };

  const updateSubGroup = (index: number, label: string) => {
    const newSelectedSubGroup = [...selectedSubGroup];
    newSelectedSubGroup[index] = label.split(',').map((value) => ({ value, label: value }));
    setSelectedSubGroup(newSelectedSubGroup);
    const newContributions = [...contributions];
    newContributions[index].arrayMap.subGroup = label.split(',');
    setContributions(newContributions);
    const status = setSubGroups(label.split(','), myVariable.project_id);
  };

  const addContributor = (index: number, contributorId: string) => {
    const newContributions = [...contributions];
    let contributorWalletId: any
    contributorWalletId = contributorId.slice(-6)
    if (!contributorWallets.includes(contributorId)) {
      setContributorWallets([...contributorWallets, contributorId]);
    }
    // Set the default token to 'ADA' with an empty value
    newContributions[index].contributors[contributorWalletId] = { ADA: "0" };
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
    if (amount) {
      updateTokenAmount(contributionIndex, contributorId, token as Tokens, amount);
    }
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
      if (i.length<6) {
        let gmblNumber: any
        let gmblNumber2: any
        gmblNumber = parseFloat(aggregatedTokens[i])
        gmblNumber2 = (gmblNumber * tokenRates[i]).toFixed(3)
        totalTokensPrep = `${totalTokensPrep}
      "${gmblNumber2} USD in ${aggregatedTokens[i]} ${i}",`
      }
    }
    return totalTokensPrep;
  }

  function updateTransactionMessage(obj: any, amount: any) {
    const newObj = { ...obj };
    const messageIndex = newObj.msg.findIndex((message: any) => message.includes("Transaction made by Treasury Guild"));
    if (messageIndex !== -1) {
      newObj.msg[messageIndex] = `Transaction made by Treasury Guild @${amount}`;
    }
    return newObj;
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

    metaData = `{
      "mdVersion": ["1.8"],
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
      const xrate = document.getElementById('xrate') as HTMLInputElement | null;
      finalMetaData = updateTransactionMessage(finalMetaData, xrate?.value);
    let thash = await executeTransaction(assetsPerAddress, adaPerAddressString, finalMetaData)
  }

  const handleClick = async () => {
    const updatedContributions = contributions.map(({ arrayMap, ...rest }) => ({ ...rest, arrayMap: arrayMap.subGroup?.length ? arrayMap : { ...arrayMap, subGroup: undefined } }));
    const updatedContributions2 = updatedContributions.map(({ arrayMap, ...rest }) => ({ ...rest, arrayMap: arrayMap.proof?.length ? arrayMap : { ...arrayMap, proof: undefined } }));
    const contributionsJSON = JSON.stringify(updatedContributions2);
    const contributorWalletsJSON = JSON.stringify(contributorWallets);
    await getValues(contributionsJSON, contributorWalletsJSON);
  };
  //console.log('myVariable', myVariable);
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
              Date:
              <input
              type="date"
              name="date"
              value={convertToISOFormat(contribution.arrayMap.date[0])}
              onChange={(e) => updateDate(index, e.target.value)}
              />
              Proof:
              <input
              type="text"
              name="proof"
              value={contribution.arrayMap.proof.join(' ')}
              onChange={(e) => updateProof(index, e.target.value)}
              />
              SubGroup:
              <ReactSelect
                isMulti
                options={[...subGroupOptions, ...userDefinedSubGroup]}
                value={selectedSubGroup[index]}
                onChange={(selected) => {
                  const newSelectedSubGroup = [...selectedSubGroup];
                  newSelectedSubGroup[index] = selected;
                  setSelectedSubGroup(newSelectedSubGroup);
                  updateSubGroup(index, selected.map((option) => option.value).join(','));
                }}
                onInputChange={(input) => {
                  setUserDefinedSubGroup(
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
                {walletTokens.some((token: any) => token.tokenType === "fungible") && 
                  <div>
                    <h2 className={styles.tokenheadings}>Fungible Tokens</h2>
                    <div className={styles.tokenButtons}>
                      {walletTokens.map((token: any) => {
                        if (token.tokenType === "fungible") {
                          return (
                            <button className={styles.tokenbtn} key={token.name} onClick={() => addToken(index, contributorId, token.name, '')}>
                              + {token.displayname}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                }
              
                {walletTokens.some((token: any) => token.tokenType === "nft") &&
                  <div>
                    <h2 className={styles.tokenheadings}>NFTs</h2>
                    <div className={styles.tokenButtons}>
                      {walletTokens.map((token: any) => {
                        if (token.tokenType === "nft") {
                          return (
                            <button className={styles.tokenbtn} key={token.name} onClick={() => addToken(index, contributorId, token.name, '1')}>
                              + {token.displayname}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                }
              </div>

                <div>
                  {Object.entries(contribution.contributors[contributorId]).map(([token, amount]) => (
                    <div className={styles.contributorToken} key={token}>
                      <label>
                        {tokenDisplayNames[token] || token} &nbsp;
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
                  addContributor(index, e.currentTarget.value.trim());
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
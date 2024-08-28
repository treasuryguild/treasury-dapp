// ../components/TableContributionBuilder.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/TableContributionBuilder.module.css';
import { setLabels } from '../utils/setLabels';
import { setSubGroups } from '../utils/setSubGroups';
import { ValueType, Tokens } from './ContributionBuilder'; // Import necessary types

type Contributor = Record<string, Partial<Record<Tokens, string>>>;
export type Contribution = {
  taskCreator: string[];
  name: string[];
  arrayMap: { label: string[]; subGroup: string[]; date: string[]; proof: string[] };
  contributors: Contributor;
};

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

const today = new Date();
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0');
const year = String(today.getFullYear()).slice(-2);
const formattedDate = `${day}.${month}.${year}`;

const TableContributionBuilder: React.FC<ContributionBuilderProps> = ({
  executeTransaction,
  onContributionsUpdate,
  onContributorWalletsUpdate,
  walletTokens,
  tokenRates,
  labels,
  subGroups,
}) => {
  const { myVariable } = useMyVariable();

  // Function to get the date in "yyyy-MM-dd" format for the input field
  const getCurrentDateForInput = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Function to convert the date in "yyyy-MM-dd" format to "dd.MM.yy" format for the metadata
  const formatDateForMetadata = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year.slice(-2)}`;
  };

  const [contributions, setContributions] = useState<Contribution[]>([
    {
      taskCreator: [myVariable.group],
      name: [],
      arrayMap: { label: [], subGroup: [], date: [getCurrentDateForInput()], proof: [] },
      contributors: {},
    },
  ]);

  const [selectedTokens, setSelectedTokens] = useState<string[]>(['']);
  const [contributorWallets, setContributorWallets] = useState<any[]>([]);
  const [labelOptions, setLabelOptions] = useState(labels);
  const [selectedLabels, setSelectedLabels] = useState<Array<ValueType>>([[]]);
  const [subGroupOptions, setSubGroupOptions] = useState(subGroups);
  const [selectedSubGroup, setSelectedSubGroup] = useState<Array<ValueType>>([[]]);

  const addContributor = (index: number, contributorId: string) => {
    const newContributions = [...contributions];
    const contributorWalletId = contributorId.slice(-6);
    if (!contributorWallets.includes(contributorId)) {
      setContributorWallets([...contributorWallets, contributorId]);
    }
    newContributions[index].contributors[contributorWalletId] = {};
    setContributions(newContributions);
  };

  const getWalletValue = (contributorId: string) => {
    const wallet = contributorWallets.find((wallet) => wallet.slice(-6) === contributorId);
    return wallet || '';
  };

  const groupSameContributions = useCallback((contribs: Contribution[]): Contribution[] => {
    const groupedContributions: Contribution[] = [];
    const contributionMap = new Map();

    contribs.forEach((contribution) => {
      const key = JSON.stringify({
        name: contribution.name,
        arrayMap: contribution.arrayMap,
      });

      if (contributionMap.has(key)) {
        const existingContribution = contributionMap.get(key);
        existingContribution.contributors = {
          ...existingContribution.contributors,
          ...contribution.contributors,
        };
      } else {
        contributionMap.set(key, { ...contribution });
      }
    });

    contributionMap.forEach((value) => {
      groupedContributions.push(value);
    });

    return groupedContributions;
  }, []);

  const [groupedContributions, setGroupedContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const grouped = groupSameContributions(contributions);
    setGroupedContributions(grouped);
    onContributionsUpdate(grouped);
  }, [contributions, groupSameContributions, onContributionsUpdate]);

  useEffect(() => {
    onContributorWalletsUpdate(contributorWallets);
  }, [contributorWallets, onContributorWalletsUpdate]);

  const addRow = () => {
    setContributions([
      ...contributions,
      {
        taskCreator: [myVariable.group],
        name: [],
        arrayMap: { label: [], subGroup: [], date: [getCurrentDateForInput()], proof: [] },
        contributors: {},
      },
    ]);
    setSelectedLabels([...selectedLabels, []]);
    setSelectedSubGroup([...selectedSubGroup, []]);
  };

  const removeRow = (index: number) => {
    const newContributions = [...contributions];
    newContributions.splice(index, 1);
    setContributions(newContributions);
    const newSelectedLabels = [...selectedLabels];
    newSelectedLabels.splice(index, 1);
    setSelectedLabels(newSelectedLabels);
    const newSelectedSubGroup = [...selectedSubGroup];
    newSelectedSubGroup.splice(index, 1);
    setSelectedSubGroup(newSelectedSubGroup);
  };

  const splitTextIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks = [];
    let currentChunk = '';
    for (const word of text.split(' ')) {
      if ((currentChunk + ' ' + word).length > chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += ' ' + word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };

  const updateField = (index: number, field: string, value: any) => {
    const newContributions: Contribution[] = [...contributions];

    if (field === 'date') {
      newContributions[index].arrayMap.date = [value];
    } else if (field === 'name') {
      const parts = splitTextIntoChunks(value, 50);
      newContributions[index].name = parts;
    } else if (field === 'proof') {
      const parts = splitTextIntoChunks(value, 50);
      newContributions[index].arrayMap.proof = parts;
    } else if (field === 'label') {
      newContributions[index].arrayMap.label = value.split(',');
      setLabels(value.split(','));
      const newSelectedLabels = [...selectedLabels];
      newSelectedLabels[index] = value.split(',').map((val: any) => ({ value: val, label: val }));
      setSelectedLabels(newSelectedLabels);
    } else if (field === 'subGroup') {
      newContributions[index].arrayMap.subGroup = value.split(',');
      setSubGroups(value.split(','), myVariable.project_id);
      const newSelectedSubGroup = [...selectedSubGroup];
      newSelectedSubGroup[index] = value.split(',').map((val: any) => ({ value: val, label: val }));
      setSelectedSubGroup(newSelectedSubGroup);
    } else if (field === 'contributorId') {
      addContributor(index, value);
    } else if (field.startsWith('token_')) {
      const [_, token] = field.split('_');
      const contributorId = Object.keys(newContributions[index].contributors)[0];

      if (contributorId) {
        if (!newContributions[index].contributors[contributorId]) {
          newContributions[index].contributors[contributorId] = {};
        }
        if (token) {
          newContributions[index].contributors[contributorId][token] = value;
        }
      }
    }

    setContributions(newContributions);
  };

  const addTokenColumn = () => {
    setSelectedTokens([...selectedTokens, '']);
  };

  const removeTokenColumn = (token: string) => {
    setSelectedTokens(selectedTokens.filter((t) => t !== token));

    // Remove the token values from each contributor when the column is removed
    const updatedContributions = contributions.map((contribution) => {
      const updatedContributors = { ...contribution.contributors };

      Object.keys(updatedContributors).forEach((contributorId) => {
        if (updatedContributors[contributorId]?.[token]) {
          delete updatedContributors[contributorId][token];
        }
      });

      return { ...contribution, contributors: updatedContributors };
    });

    setContributions(updatedContributions);
  };

  const updateTokenColumn = (index: number, token: string) => {
    const newSelectedTokens = [...selectedTokens];
    const oldToken = newSelectedTokens[index];
  
    if (oldToken) {
      // Clear previous token values when changing the token
      const updatedContributions = contributions.map((contribution) => {
        const updatedContributors = { ...contribution.contributors };
  
        Object.keys(updatedContributors).forEach((contributorId) => {
          if (updatedContributors[contributorId]?.[oldToken]) {
            delete updatedContributors[contributorId][oldToken];
          }
        });
  
        return { ...contribution, contributors: updatedContributors };
      });
  
      setContributions(updatedContributions);
    }
  
    // Set the new token
    newSelectedTokens[index] = token;
    setSelectedTokens(newSelectedTokens);
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

            if (!isNaN(tokenValue) && tokenValue > 0) {
              if (result[token]) {
                result[token] += tokenValue;
              } else {
                result[token] = tokenValue;
              }
            }
          }
        }
      }
    });

    const formattedResult: { [token: string]: string } = {};
    for (const token in result) {
      if (result[token] > 0) {
        formattedResult[token] = result[token].toFixed(2);
      }
    }

    return formattedResult;
  }

  async function getTotalTokens(aggregatedTokens: {} | any) {
    let totalTokensPrep = '';
    for (let i in aggregatedTokens) {
      if (i.length < 6 && parseFloat(aggregatedTokens[i]) > 0) {
        let gmblNumber: any;
        let gmblNumber2: any;
        gmblNumber = parseFloat(aggregatedTokens[i]);
        gmblNumber2 = (gmblNumber * tokenRates[i]).toFixed(3);
        totalTokensPrep = `${totalTokensPrep}
      "${gmblNumber2} USD in ${aggregatedTokens[i]} ${i}",`;
      }
    }
    return totalTokensPrep;
  }

  function updateTransactionMessage(obj: any, amount: any) {
    const newObj = { ...obj };
    const messageIndex = newObj.msg.findIndex((message: any) =>
      message.includes('Transaction made by Treasury Guild')
    );
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
    assetsPerAddress = {};
    contJson = JSON.parse(contributionsJSON);
    walletsArray = JSON.parse(contributorWalletsJSON);

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
      for (const [contributorAddress, tokens] of Object.entries<ContributorTokens>(
        content.contributors
      )) {
        for (const walletAddress of walletsArray) {
          if (walletAddress.includes(contributorAddress)) {
            if (!assetsPerAddress[walletAddress]) {
              assetsPerAddress[walletAddress] = [];
            }

            for (const walletToken of walletTokens) {
              const tokenName = walletToken.name;

              if (tokens.hasOwnProperty(tokenName)) {
                const tokenValue: any = tokens[tokenName]!;
                if (tokenValue && !isNaN(parseFloat(tokenValue))) {
                  const value = parseFloat(tokenValue) * Math.pow(10, walletToken.decimals);

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

    const aggregatedTokens = aggregateTokens(contJson);
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
      `;
    let finalMetaData = {};
    finalMetaData = JSON.parse(metaData);
    const xrate = document.getElementById('xrate') as HTMLInputElement | null;
    finalMetaData = updateTransactionMessage(finalMetaData, xrate?.value);
    //console.log('finaData', assetsPerAddress, adaPerAddressString, finalMetaData);
    let thash = await executeTransaction(assetsPerAddress, adaPerAddressString, finalMetaData);
  }

  const handleClick = async () => {
    const updatedContributions = groupedContributions.map(({ arrayMap, ...rest }) => ({
      ...rest,
      arrayMap: arrayMap.subGroup?.length ? arrayMap : { ...arrayMap, subGroup: undefined },
    }));
    const updatedContributions2 = updatedContributions.map(({ arrayMap, ...rest }) => ({
      ...rest,
      arrayMap: arrayMap.proof?.length ? arrayMap : { ...arrayMap, proof: undefined },
    }));

    // When preparing the metadata, use the "dd.MM.yy" format
    const contributionsJSON = JSON.stringify(
      updatedContributions2.map((contribution) => ({
        ...contribution,
        arrayMap: {
          ...contribution.arrayMap,
          date: [formatDateForMetadata(contribution.arrayMap.date[0])],
        },
      }))
    );

    const contributorWalletsJSON = JSON.stringify(contributorWallets);
    await getValues(contributionsJSON, contributorWalletsJSON);
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.contributionTable}>
        <thead>
          <tr>
            <th>Labels</th>
            <th>Description</th>
            <th>Date</th>
            <th>Proof</th>
            <th>SubGroup</th>
            <th>Contributor</th>
            {selectedTokens.map((token, index) => (
              <th key={index}>
                <select
                  value={token}
                  onChange={(e) => updateTokenColumn(index, e.target.value)}
                  className={styles.tokenSelect}
                >
                  <option value="">Select Token</option>
                  {walletTokens.map((t: any) => (
                    <option key={t.name} value={t.name}>
                      {t.displayname}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeTokenColumn(token)}>X</button>
              </th>
            ))}
            <th>
              <button onClick={addTokenColumn}>Add Token</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((contribution, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  value={contribution.arrayMap.label.join(',')}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={contribution.name.join(' ')}
                  onChange={(e) => updateField(index, 'name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="date"
                  value={contribution.arrayMap.date[0]} // Now using the date for the input field
                  onChange={(e) => updateField(index, 'date', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={contribution.arrayMap.proof.join(' ')}
                  onChange={(e) => updateField(index, 'proof', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={contribution.arrayMap.subGroup.join(',')}
                  onChange={(e) => updateField(index, 'subGroup', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={getWalletValue(Object.keys(contribution.contributors)[0] || '')}
                  onChange={(e) => updateField(index, 'contributorId', e.target.value)}
                />
                <p style={{ fontSize: 'smaller' }}>ID: {Object.keys(contribution.contributors)[0] || ''}</p>
              </td>
              {selectedTokens.map((token) => (
                <td key={token}>
                  <input
                    type="text"
                    value={contribution.contributors[Object.keys(contribution.contributors)[0]]?.[token] || ''}
                    onChange={(e) => updateField(index, `token_${token}`, e.target.value)}
                    disabled={!token}
                  />
                </td>
              ))}
              <td>
                <button onClick={() => removeRow(index)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow}>Add Row</button>
      {Object.keys(tokenRates).length !== 0 && (
        <button className={styles.executeTxButton} onClick={handleClick}>
          Execute Transaction
        </button>
      )}
    </div>
  );
};

export default TableContributionBuilder;

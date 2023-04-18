import React, { useState, useEffect } from 'react';
import styles from '../styles/TxBuilder.module.css';
import ReactSelect from 'react-select';

type Tokens = 'ADA' | 'GMBL' | 'AGIX';

type Contributor = Record<string, Partial<Record<Tokens, string>>>;
export type Contribution = {
  taskCreator: string;
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

export type ContributionFormProps = {
  onContributionsUpdate: (contributions: Contribution[]) => void;
  myVariable: string; // define the prop you want to receive
};

const tokensList: Tokens[] = ['ADA', 'GMBL', 'AGIX'];
const contributorWallets: any[] = []

const ContributionForm: React.FC<ContributionFormProps> = ({ onContributionsUpdate, myVariable }) => {
  
  const [contributions, setContributions] = useState<Contribution[]>([{
    taskCreator: 'catalyst swarm',
    name: [],
    label: [],
    contributors: {},
  }]);
  const [labelOptions, setLabelOptions] = useState<OptionsType>([
    { value: 'Operations', label: 'Operations' },
    { value: 'Fixed Costs', label: 'Fixed Costs' },
    { value: myVariable, label: myVariable },
  ]);
  const [selectedLabels, setSelectedLabels] = useState<Array<ValueType>>([[]]);
  const [userDefinedLabels, setUserDefinedLabels] = useState<OptionsType>([]);

  useEffect(() => {
    // Call the onContributionsUpdate callback function whenever the contributions state is updated
    onContributionsUpdate(contributions);
  }, [contributions]);

  const addContribution = () => {
    setContributions([
      ...contributions,
      {
        taskCreator: 'catalyst swarm',
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
      if (potentialPart.length > 20) {
        parts.push(currentPart);
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
      contributorWallets.push(contributorId)
    }
    // Set the default token to 'ADA' with an empty value
    newContributions[index].contributors[contributorWalletId] = { ADA: "" };
    setContributions(newContributions);
    console.log("contributorWallets",contributorWallets)
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
                  <button onClick={() => addToken(index, contributorId, 'ADA', '')}>+ ADA</button>
                  <button onClick={() => addToken(index, contributorId, 'GMBL', '')}>+ GMBL</button>
                  <button onClick={() => addToken(index, contributorId, 'AGIX', '')}>+ AGIX</button>
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
            To add contributor enter wallet address and hit enter:
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
    </div>
  );
};

export default ContributionForm;
import React, { useState, useEffect } from 'react';
import styles from '../styles/TxBuilder.module.css'

type Tokens = 'ADA' | 'GMBL' | 'AGIX';

type Contributor = Record<string, Record<Tokens, string>>;
type Contribution = {
  taskCreator: string;
  name: string[];
  label: string[];
  contributors: Contributor;
};

type ContributionFormProps = {
  onContributionsUpdate: (contributions: Contribution[]) => void;
};

const tokensList: Tokens[] = ['ADA', 'GMBL', 'AGIX'];
const contributorWallets: any[] = []

const ContributionForm: React.FC<ContributionFormProps> = ({ onContributionsUpdate }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);

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
  };

  const removeContribution = (index: number) => {
    const newContributions = [...contributions];
    newContributions.splice(index, 1);
    setContributions(newContributions);
  };

  const updateName = (index: number, name: string) => {
    const newContributions = [...contributions];
    newContributions[index].name = name.split(',');
    setContributions(newContributions);
  };

  const updateLabel = (index: number, label: string) => {
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
    newContributions[index].contributors[contributorWalletId] = { ADA: "", GMBL: "", AGIX: "" };
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
            <button className={styles.contributionButton} onClick={() => removeContribution(index)}>Remove Contribution</button>
          </div> 
          <label>
            Labels (comma-separated):
            <input
              type="text"
              value={contribution.label.join(',')}
              onChange={(e) => updateLabel(index, e.target.value)}
            />
          </label>
          <br />
          <label>
            Description:
            <textarea
              style={{ width: '200px', height: '50px' }}
              value={contribution.name.join(',')}
              onChange={(e) => updateName(index, e.target.value)}
            />
          </label>
          <br />
          {Object.keys(contribution.contributors).map((contributorId) => (
            <div key={contributorId}>
              <h3>Contributor ID: {contributorId}</h3>
              <p>wallet: {getWalletValue(contributorId)}</p>
              <button onClick={() => removeContributor(index, contributorId)}>
                Remove Contributor
              </button>
              <br />
              {Object.entries(contribution.contributors[contributorId]).map(([token, amount]) => (
                <div key={token}>
                  <label>
                    {token} Amount:
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) =>
                        updateTokenAmount(index, contributorId, token as Tokens, String(e.target.value))
                      }
                    />
                  </label>
                  <button onClick={() => removeToken(index, contributorId, token as Tokens)}>
                    Remove {token}
                  </button>
                </div>
              ))}
              <button onClick={() => addToken(index, contributorId, 'ADA', '')}>+ ADA</button>
              <button onClick={() => addToken(index, contributorId, 'GMBL', '')}>+ GMBL</button>
              <button onClick={() => addToken(index, contributorId, 'AGIX', '')}>+ AGIX</button>
            </div>
          ))}
          <label>
            Enter Wallet address and hit enter:
            <input
              type="text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addContributor(index, e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </label>
        </div>
      ))}
      <button className={styles.contributionButton} onClick={addContribution}>Add Contribution</button>
      {/*<pre>{JSON.stringify(contributions, null, 2)}</pre>*/}
    </div>
  );
};

export default ContributionForm;
import React, { useState } from 'react';

type Tokens = 'ADA' | 'GMBL' | 'AGIX';

type Contributor = Record<string, Record<Tokens, number>>;
type Contribution = {
  taskCreator: string;
  name: string[];
  label: string[];
  contributors: Contributor;
};

const tokensList: Tokens[] = ['ADA', 'GMBL', 'AGIX'];

const ContributionForm: React.FC = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);

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
    newContributions[index].contributors[contributorId] = {};
    setContributions(newContributions);
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
    amount: number
  ) => {
    const newContributions = [...contributions];
    newContributions[contributionIndex].contributors[contributorId][token] = amount;
    setContributions(newContributions);
  };

  const updateTokenAmount = (
    contributionIndex: number,
    contributorId: string,
    token: Tokens,
    amount: number
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
      <button onClick={addContribution}>Add Contribution</button>
      {contributions.map((contribution, index) => (
        <div key={index}>
          <h2>Contribution {index + 1}</h2>
          <button onClick={() => removeContribution(index)}>Remove Contribution</button>
          <br />
          <label>
            Contribution Name (comma-separated):
            <input
              type="text"
              value={contribution.name.join(',')}
              onChange={(e) => updateName(index, e.target.value)}
            />
          </label>
          <br />
          <label>
            Labels (comma-separated):
            <input
              type="text"
              value={contribution.label.join(',')}
              onChange={(e) => updateLabel(index, e.target.value)}
            />
          </label>
          <br />
          {Object.keys(contribution.contributors).map((contributorId) => (
            <div key={contributorId}>
              <h3>Contributor ID: {contributorId}</h3>
              <button onClick={() => removeContributor(index, contributorId)}>
                Remove Contributor
              </button>
              <br />
              {Object.entries(contribution.contributors[contributorId]).map(([token, amount]) => (
                <div key={token}>
                  <label>
                    {token} Amount:
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) =>
                        updateTokenAmount(index, contributorId, token as Tokens, Number(e.target.value))
                      }
                    />
                  </label>
                  <button onClick={() => removeToken(index, contributorId, token as Tokens)}>
                    Remove {token}
                  </button>
                </div>
              ))}
              <button onClick={() => addToken(index, contributorId, 'ADA', 0)}>+ ADA</button>
              <button onClick={() => addToken(index, contributorId, 'GMBL', 0)}>+ GMBL</button>
              <button onClick={() => addToken(index, contributorId, 'AGIX', 0)}>+ AGIX</button>
            </div>
          ))}
          <label>
            Add Contributor ID:
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
      <pre>{JSON.stringify(contributions, null, 2)}</pre>
    </div>
  );
};

export default ContributionForm;
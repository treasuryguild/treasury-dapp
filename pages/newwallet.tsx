import { useEffect, SetStateAction, useState, Key, ReactElement, ReactFragment, ReactPortal, JSXElementConstructor } from 'react'
import styles from '../styles/Singletx.module.css'
import { useWallet } from '@meshsdk/react';
import { useRouter } from 'next/router'
import axios from 'axios';
import { getGroups } from '../utils/getGroups';
import { newWallet } from '../utils/newWallet';

type Group = {
  group_id: string;
  group_name: string;
};

type GroupData = {
  group_name: string;
  // Add other properties of the group object as needed
};

type ProjectData = {
  project_name: string;
  wallet: string;
  // Add other properties of the project object as needed
};


function Newwallet() {

  const tickerAPI = `${process.env.NEXT_PUBLIC_TICKER_API}`
  //const tickerAPI = 'https://community-treasury-dapp.netlify.app/api/tickers'
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { connected, wallet } = useWallet();
  const [walletTokens, setWalletTokens] = useState<[] | any>([])
  const [walletTokenUnits, setWalletTokenUnits] = useState<[] | any>([])
  const [tokenRates, setTokenRates] = useState<{} | any>({})
  const [tokens, setTokens] = useState<[] | any>([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}])
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  useEffect(() => {
    if (connected) {
      assignTokens()
    } else {setTokens([{"id":"1","name":"ADA","amount":0.00,"unit":"lovelace","decimals": 6}]);}
  }, [connected]);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    let fetchedGroups = await getGroups();
    setGroups(fetchedGroups);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function assignTokens() {
    let tokenNames: string[] = []
    let tokenFingerprint: any[] = []
    let tokenAmounts: any[] = []
    let finalTokenAmount = 0
    let tokenUnits: any[] = []
    let tickerDetails = await axios.get(tickerAPI)
    let walletBalance = await wallet.getBalance();
    const assets = await wallet.getAssets();
    let totalAmount = parseFloat(walletBalance[0].quantity).toFixed(6)
    let finalamount = (parseFloat(totalAmount)/1000000).toFixed(6)
    let tokens = [{"id":"1","name":"ADA","amount":parseFloat(finalamount).toFixed(6),"unit":"lovelace", "decimals": 6, "fingerprint":""}]
    assets.map(asset => {
      if (asset.quantity > 1) {
        tokenNames.push((asset.assetName).slice(0,4))
        tokenFingerprint.push(asset.fingerprint)
        tokenUnits.push(asset.unit)
        if (asset.fingerprint === tickerDetails.data.tickerFingerprints[asset.assetName]) {
          finalTokenAmount = asset.quantity/(10**tickerDetails.data.tickerDecimals[asset.assetName])
        } else {
          finalTokenAmount = (parseFloat(asset.quantity)/1000000)
        }
        tokenAmounts.push((finalTokenAmount).toFixed(6))
      }
    })
    setWalletTokenUnits(tokenUnits);
    if (tokenNames.includes("gimbal")) {
      const index = tokenNames.indexOf("gimbal");
      tokenNames[index] = "GMBL";
    }
    tokenNames.map((name, index) => {
      tokens.push(JSON.parse(`{"id":"${index+2}","name":"${name}","amount":${tokenAmounts[index]}, "unit":"${tokenUnits[index]}", "fingerprint":"${tokenFingerprint[index]}"}`))
    })
    setWalletTokens(tokens);
    await getAssetDetails(tokens);
    await getEchangeRate(tokens);
  }

  async function getAssetDetails(tokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let updatedTokens = tokens
    const usedAddresses = await wallet.getUsedAddresses();
    try {
      await axios.get(`https://pool.pm/wallet/${usedAddresses[0]}`).then(response => {
        const details = response.data;
        for (let i in response.data.tokens) {
          if (response.data.tokens[i].decimals) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tokens[i].fingerprint) {
                updatedTokens[j]['name'] = response.data.tokens[i].metadata.ticker
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tokens[i].metadata.decimals;
              }
            }
          }
        }
        });
      // continue with the signed transaction
    } catch (error) {
      console.error('An error occurred while signing the transaction:', error);
      //try api
      await axios.get(tickerAPI).then(response => {
        const details = response.data;
        for (let i in response.data.tickerApiNames) {
            for (let j in updatedTokens) {
              if (tokens[j].fingerprint == response.data.tickerFingerprints[i]) {
                updatedTokens[j]['name'] = i;
                updatedTokens[j]['decimals'] = 0;
                updatedTokens[j]['decimals'] = response.data.tickerDecimals[i];
              } else {
                updatedTokens[j]['decimals'] = 6;
              }
            }
        }
        });
      // handle the error as appropriate
    }
    setWalletTokens(updatedTokens);
  }

  function getValue(name: string){
    let element: HTMLElement | any
    element = document.getElementById(name)
    return element.value
  }

  async function getEchangeRate(wallettokens: { id: string; name: string; amount: string; unit: string; decimals: number; fingerprint: string; }[]) {
    let tickerDetails = await axios.get(tickerAPI)
    let tickers = tickerDetails.data.tickerApiNames;
    let tokenExchangeRates: any = {}
    for (let i in wallettokens) {
      try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${tickers[wallettokens[i].name]}&vs_currencies=usd`)
        const rate = response.data[tickers[wallettokens[i].name]].usd;
        if (rate !== undefined) {
          tokenExchangeRates[wallettokens[i].name] = parseFloat(rate).toFixed(3)
          if (wallettokens[i].name == "ADA") {
            let xrates: HTMLElement | any
            xrates = document.getElementById('xrate')
            xrates.value = parseFloat(rate).toFixed(3);
          }
        } else {
          tokenExchangeRates[wallettokens[i].name] = 0.00
        }
      } catch (error) {
        console.log(`Failed to get exchange rate for ${wallettokens[i].name}: `, error);
        tokenExchangeRates[wallettokens[i].name] = 0.00
      }
    }
    setTokenRates(tokenExchangeRates)
  }  

  async function promptPasswordAndRunFunction() {
    const password = prompt('Please enter the password:');
  
    if (!password) {
      return;
    }
  
    try {
      await axios.post('/api/verify-password', { password });
      // If the password is correct, the request will succeed, and you can run the protected function
      await runProtectedFunction();
    } catch (error) {
      console.log("error",error)
      //alert('Invalid password');
    }
  }
  
  async function runProtectedFunction() {
    // The protected function logic goes here
    console.log('Protected function executed');
    await getValues();
  }

  async function commitFile(filePath: string, fileContent: string) {
    const commitMessage = 'Transaction';
  
    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, fileContent, commitMessage }),
      });
  
      if (!response.ok) {
        throw new Error('Error committing file');
      }
  
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error committing file to GitHub:', error);
    }
  }

  async function getValues() {
    setIsLoading(true);
    let customFilePath = '';
    let customFileContent = '';
    const group = selectedGroupName;
    const project = getValue('project');
    const website = getValue('website');
    const projectType = getValue('projectType');
    const description = getValue('description');
    const usedAddresses = await wallet.getUsedAddresses();
    
    let metadata = `{
"project": "${group}",
"proposal": "${project}",
"fund": "${projectType}",
"budget": "50000",
"budgetItems": {"Incoming":"50000","Other":"10","bulkTransactions":"50000","Swap":"5000","Bounty":"20000","Contributors":"20000","Fixed-Costs":"5000"},
"website": "${website}",
"wallet": "${usedAddresses[0]}",
"description":"${description}"
}
`
    let prename = ''
    let name = (project).replace(/\s/g, '-')
    if (projectType == 'TreasuryWallet') {
      prename = 'TW'
    } else {prename = 'F10'}
    var copyData = (metadata);
    copyData = JSON.parse(copyData)
    const budgetItems = {"Incoming":"50000","Other":"10","bulkTransactions":"50000","Swap":"5000","Bounty":"20000","Contributors":"20000","Fixed-Costs":"5000"}
    customFileContent = `${JSON.stringify(copyData, null, 2)}`;
    customFilePath = `proposals/${prename}-${name}.json`;
    await commitFile(customFilePath, customFileContent)
    let groupData = { group_name: group }
    let projectData = { project_name: project, project_type: projectType, website: website, wallet: usedAddresses[0], budget_items: budgetItems }
    //console.log("Test", groupData, projectData)
    await newWallet(groupData, projectData);
    setTimeout(function() {
      router.push(`/txbuilder/`)
      setIsLoading(false);
    }, 1000); // 3000 milliseconds = 3 seconds
  }

  const handleGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    if (selectedValue === "add-new") {
      setShowNewGroupInput(true);
      setSelectedGroupName(''); // Reset selected group name when 'Add new' is chosen
    } else {
      setShowNewGroupInput(false);
      setSelectedGroupName(selectedValue); // Set the selected group name
    }
  };

  const handleNewGroupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedGroupName(event.target.value);
  };
  
    return (
      <>
      {isLoading ? (
      <div className={styles.loadingScreen}>Loading...</div> 
      ) : (
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>New Project</h1>
        </div>
        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.formitem}>
            <label className={styles.custom}>
              <select id="group" onChange={handleGroupChange} value={selectedGroupName}>
                <option value="" disabled>Please select</option>
                {groups.map((group) => (
                  <option key={group.group_id} value={group.group_name}>
                    {group.group_name}
                  </option>
                ))}
                <option value="add-new">Add new</option>
              </select>
                <span className={styles.tag}>Your Organization&apos;s name</span>
              </label>
              {showNewGroupInput && (
                <input
                  type="text"
                  id="newGroup"
                  name="newGroup"
                  placeholder="Enter new organization name"
                  onChange={handleNewGroupChange}
                />
              )}
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='project'
                    name='project'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Name of project/wallet</span>
                <span className={styles.tag}>Project/Wallet name</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='website'
                    name='website'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>URL</span>
                <span className={styles.tag}>Project website</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <select id="projectType">
                  <option value="TreasuryWallet">Treasury Wallet</option>
                  <option value="Proposal">Proposal</option>
                </select>
                <span className={styles.tag}>Wallet Type</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <textarea
                    id='description'
                    name='description'
                    autoComplete="off"
                    required
                />
                <span className={styles.tag}>Description</span>
              </label>
            </div>
          </div>
          <div className={styles.balances}>
            <div><h2>Token Balances</h2></div>
            <div>
            {walletTokens.map((token: { id: Key | null | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; amount: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal | null | undefined; }) => {
              return (                
                <p key={token.id}>{token.name} {token.amount}</p>
              )
            })}
            </div>
          </div>
        </div> 
        <div className={styles.submit}>
          <div>
            <button className={styles.submitbut}
              type="button"
              onClick={() => getValues()}
              >Build
            </button>
          </div>
        </div>
      </div>
      )}
      </>
    )
  }
  
  export default Newwallet
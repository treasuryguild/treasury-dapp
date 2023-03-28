import { SetStateAction, useState } from 'react'
import styles from '../../styles/Singletx.module.css'

function Singletx() {

  const [selectedOption, setSelectedOption] = useState('')
  const [tokens, setTokens] = useState([{"id":"1","name":"ADA","amount":0}])
  const walletTokens = [{"id":"1","name":"ADA","amount":0},
  {"id":"2","name":"DJED","amount":0},
  {"id":"3","name":"AGIX","amount":0},
  {"id":"4","name":"NTX","amount":0},
  {"id":"5","name":"GMBL","amount":0},
  {"id":"6","name":"COPI","amount":0}
  ]

  function handleOptionChange(event: { target: { value: SetStateAction<string>; }; }) {
    let token = tokens
    setSelectedOption(event.target.value)
    token[event.target.id-1].name = event.target.value
    setTokens(token);
    console.log("Selected option:", event.target.value , event.target.id, tokens)
    // Call your function here based on the selected option
  }

  function handleTokenChange(event: { target: { value: string; id: string }; }) {
    const token = tokens[event.target.id - 1];
    token.amount = parseInt(event.target.value);
    setTokens([...tokens]); // create a new array with updated values to trigger a re-render
  }

  async function addToken() {
    const newToken = {"id": `${tokens.length + 1}`, "name": "ADA", "amount": 0};
    setTokens([...tokens, newToken]);
    console.log("Adding Token", tokens);
  }

  function getValue(name){
    return document.getElementById(name).value
  }

  async function getValues() {
    const id = getValue('id');
    const wallet = getValue('wallet');
    const label = getValue('label');
    const description = getValue('description');
    console.log("Getting user input", tokens, id, wallet, label, description)
  }
  
    return (
      <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>Single transaction Builder</h1>
        </div>
        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='id'
                    name='id'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>ID</span>
                <span className={styles.tag}>Wallet Owner ID</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='wallet'
                    name='wallet'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>wallet address</span>
                <span className={styles.tag}>ADA wallet addr</span>
              </label>
            </div>
            <div className={styles.formitem}>
              <label className={styles.custom}> 
                <input
                    type='text'
                    id='label'
                    name='label'
                    autoComplete="off"
                    required
                />
                <span className={styles.placeholder}>Label</span>
                <span className={styles.tag}>Task Type</span>
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
          <div className={styles.tokens}>
              {tokens.map(token => {
                return (
                  <div className={styles.token} key={token.id}>
                    <div className={styles.tokenitem}>
                      <label className={styles.custom3}> 
                      <input
                        type='text'
                        id={token.id}
                        name='amount'
                        autoComplete="off"
                        required
                        onChange={handleTokenChange}
                      />
                        <span className={styles.placeholder}>Amount</span>
                        <span className={styles.tag}>{token.name}</span>
                      </label>
                      <select name="" id={token.id} className={styles.selecttoken} onChange={handleOptionChange}>
                          {walletTokens.map(token => {
                            return (                
                              <option key={token.id} value={token.name}>{token.name}</option>
                            )
                          })}
                      </select>
                    </div>
                  </div>
                )
              })}
              <div className={styles.addtoken}>
                <button className={styles.but} 
                  type="button"
                  onClick={() => addToken()}
                  >
                  +
                </button>
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
      </>
    )
  }
  
  export default Singletx
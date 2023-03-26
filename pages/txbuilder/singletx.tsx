import styles from '../../styles/Singletx.module.css'

function Singletx() {
    return (
      <>
      <div className={styles.main}>
        <div className={styles.heading}>
          <h1>Single transaction Builder</h1>
        </div>
        <div className={styles.form}>
          <div className={styles.formitem}>
            <label className={styles.custom}> 
              <input
                  type='text'
                  id='name'
                  name='name'
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
                  id='name'
                  name='name'
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
                  id='name'
                  name='name'
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
                  id='name'
                  name='name'
                  autoComplete="off"
                  required
              />
              <span className={styles.tag}>Description</span>
            </label>
          </div>
        </div>
      </div>
      </>
    )
  }
  
  export default Singletx
import Link from 'next/link'

function TransactionList({ transactionType = 100 }) {
  return (
    <>
      <Link href='/'>
        Home
      </Link>
      <h2>
        <Link href='transaction/1'>
          Transaction 1
        </Link>
      </h2>
      <h2>
        <Link href='transaction/2'>
          Transaction 2
        </Link>
      </h2>
      <h2>
        <Link href='transaction/3' replace>
          Transaction 3
        </Link>
      </h2>
      <h2>
        <Link href={`transaction/${transactionType}`}>
          Transaction {transactionType}
        </Link>
      </h2>
    </>
  )
}

export default TransactionList
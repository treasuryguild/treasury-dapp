import Link from 'next/link'

function TransactionList({ transactionType = 100 }) {
  return (
    <>
      <h2>
        <Link href='transaction/single'>
          Single Transaction
        </Link>
      </h2>
      <h2>
        <Link href='transaction/bulk'>
          Bulk Transaction
        </Link>
      </h2>
      <h2>
        <Link href='transaction/dework-bulk' replace>
          Dework Bulk Transaction
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
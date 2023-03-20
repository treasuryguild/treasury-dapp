import { useRouter } from 'next/router'

function TransactionDetail() {
  const router = useRouter()
  const transactionType = router.query.transactionType
  return <h1>Details about transactionType {transactionType}</h1>
}

export default TransactionDetail
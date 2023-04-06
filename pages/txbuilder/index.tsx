import Link from 'next/link'
import { useRouter } from 'next/router'
import TransactionForm from '../../components/ContributionForm';

function TransactionList() {
  const router = useRouter()
  
  return (
    <>
      <h2>
        <Link href='txbuilder/singletx'>
          Single Transaction
        </Link>
      </h2>
      <h2>
        <Link href='txbuilder/bulktx'>
          Bulk Transaction
        </Link>
      </h2>
      <h2>
        <Link href='txbuilder/deworkbulktx' replace>
          Dework Bulk Transaction
        </Link>
      </h2>
      <TransactionForm />
    </>
  )
}

export default TransactionList
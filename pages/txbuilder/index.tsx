import Link from 'next/link'
import { useRouter } from 'next/router'

function TransactionList() {
  const router = useRouter()
  
  return (
    <>
      <h2>
        <Link href='txbuilder/buildtx'>
          Manual Transaction Builder
        </Link>
      </h2>
      <h2>
        <Link href='txbuilder/deworkbulktx' replace>
          Dework Import Transaction Builder
        </Link>
      </h2>
    </>
  )
}

export default TransactionList
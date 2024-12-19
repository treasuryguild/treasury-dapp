// src/utils/googleSheets.ts
interface TransactionData {
  transactionId: string;
  proposalId: string;
  milestoneId?: string;
  amountReceived?: number;
  amountDistributed?: number;
  date?: string;
  transactionType?: string;
  recipient?: string;
  paymentMethod?: string;
  referenceHash?: string;
}

// Validation function
function validateTransaction(transaction: TransactionData): string | null {
  if (!transaction.transactionId) return 'Transaction ID is required';
  if (!transaction.proposalId) return 'Proposal ID is required';
  if (transaction.amountReceived === undefined && transaction.amountDistributed === undefined) {
    return 'Either amountReceived or amountDistributed must be provided';
  }
  return null;
}

export async function recordTransaction(transaction: TransactionData) {
  const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
  
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('Google Script URL not configured');
  }

  // Validate transaction before sending
  const validationError = validateTransaction(transaction);
  if (validationError) {
    throw new Error(validationError);
  }
  
  try {
    console.log('Sending transaction data:', transaction); // Debug log

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(transaction),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Received response:', result); // Debug log
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to record transaction');
    }
    
    return result;
    
  } catch (error) {
    console.error('Failed to record transaction:', error);
    throw error;
  }
}
// src/pages/testGoogle.tsx
import { useState } from 'react';

export default function TransactionTester() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const testTransaction = async () => {
    setIsLoading(true);
    setStatus('');
    
    try {
      const transactionData = {
        transactionId: `TX_${Date.now()}`,
        proposalId: "PROP_456",
        amountReceived: 1000,
        amountDistributed: 0, // Added this field
        milestoneId: "M1",
        transactionType: "Incoming",
        referenceHash: "0x789...",
        paymentMethod: "ADA",
        recipient: "Team Wallet",
        date: new Date().toISOString()
      };

      console.log('Sending transaction:', transactionData); // Debug log
      
      const response = await fetch('/api/mesh_google_transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to record transaction');
      }
      
      setStatus(`Success: ${data.message}`);
      
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
      console.error('Transaction error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <button 
        onClick={testTransaction}
        disabled={isLoading}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Recording...' : 'Test Transaction'}
      </button>
      {status && (
        <div className={`mt-4 p-2 border rounded ${
          status.includes('Error') ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
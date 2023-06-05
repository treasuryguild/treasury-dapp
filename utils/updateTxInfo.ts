import { supabase } from "../lib/supabaseClient";

interface Transaction {
  id: string;
  total_tokens?: string[];
  total_amounts?: number[];
}

export async function updateTxInfo(myVariable:any, metaData:any, thash: any, customFilePath: any) {
  
  async function updateTransactionInfo(myVariable:any, metaData:any, thash: any, customFilePath: any) {
    
    const { data: insertResult, error } = await supabase
    .from("transactioninfo")
    .insert([
        { 
            txinfo: myVariable, 
            txhash: thash,
            txfilepath: customFilePath, 
            metadata: metaData,
        }
    ])
    .select(`id`)
    .single();;

    if (error) throw error;
    const data = insertResult as unknown as Transaction;

    const id: string | null = data && data.id ? data.id : null;

    return { id };
  }

  let { id } = await updateTransactionInfo(myVariable, metaData, thash, customFilePath);
}

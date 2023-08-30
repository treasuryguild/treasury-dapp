import { Handler } from "@netlify/functions";
import supabase from "../lib/supabaseClient";
import { sendDiscordMessage } from '../utils/sendDiscordMessage'
import { commitFile } from '../utils/commitFile'
import { checkAndUpdate } from '../utils/checkAndUpdate'

interface Transaction {
  tx_id: string;
  total_tokens?: string[];
  total_amounts?: number[];
}

interface ContributionInsertResult {
  contribution_id: string;
}

const handler: Handler = async (event: any, context: any) => {

    const { thash, myVariable, customFilePath, metaData } = JSON.parse(event.body);

        const total_tokens = Object.keys(myVariable.totalAmounts);
        const total_amounts = Object.values(myVariable.totalAmounts);
        
        async function updateTransactions(myVariable:any, thash: any) {
          let recipients = ''
          const adaObject = myVariable.walletBalanceAfterTx.find((obj: any) => obj.name === 'ADA');
          const adaBalance = adaObject ? adaObject.amount : 0;
          const recipientsMsg = metaData.msg.find((msg: string) => msg.startsWith("Recipients: "));
              if (recipientsMsg) {
                  const numberOfRecipients = recipientsMsg.split(' ')[1];
                  recipients = numberOfRecipients;
              }
      
          const { data: insertResult, error } = await supabase
          .from("transactions")
          .insert([
              { 
                  transaction_id: thash, 
                  transaction_date: new Date().getTime().toString(),
                  wallet_balance_after: adaBalance, 
                  md_version: metaData.mdVersion[0],
                  tx_json: metaData,
                  tx_json_url: `https://raw.githubusercontent.com/treasuryguild/treasury-system-v4/main/${customFilePath}`,
                  exchange_rate: myVariable.tokenRates.ADA,
                  recipients: recipients,
                  fee: myVariable.fee,
                  tx_type: myVariable.txtype,
                  total_ada: myVariable.totalAmounts.ADA,
                  project_id: myVariable.project_id,
                  total_tokens: total_tokens,
                  total_amounts: total_amounts,
                  monthly_budget_balance: myVariable.monthly_budget_balance
              }
          ])
          .select(`tx_id`)
          .single();
      
          if (error) throw error;
          const data = insertResult as unknown as Transaction;
      
          const tx_id: string | null = data && data.tx_id ? data.tx_id : null;
      
          return { tx_id };
        }
      
      
        async function updateContributors(walletAddress: string, contributorKey: string) {
          const { error } = await supabase
            .from("contributors")
            .upsert([
              { 
                contributor_id: contributorKey, 
                wallet: walletAddress
              }
            ]);
        
          if (error) throw error;
          return contributorKey;
        }
        
      
        async function updateContributionsAndDistributions(myVariable: any, tx_id: any, metaData: any) {
            for (const contribution of metaData.contributions) {
              const task_name = contribution.name ? contribution.name.join(' ') : null;
              const task_date = contribution?.arrayMap?.date?.join(',') || null;
              const task_sub_group = contribution?.arrayMap?.subGroup?.join(',') || null;
              const task_array_map = contribution.arrayMap ? contribution.arrayMap : null;
              const task_description = contribution.description ? contribution.description.join(' ') : null;
          
              let taskType: any = '';
              const task_label = (contribution?.arrayMap?.label && contribution.arrayMap.label.length > 0) ? contribution.arrayMap.label.join(',') : (Array.isArray(contribution.label) ? contribution.label.join(',') : (contribution.label ? contribution.label : null));
              if (myVariable.txtype == "Incoming" || task_label == 'Incoming') {
                taskType = "Incoming";
              } else {
                taskType = myVariable.txtype; //getTaskType(task_name, task_label, task_description);
              }
          
              const { data: insertResult, error } = await supabase
                .from('contributions')
                .insert([
                  {
                    project_id: myVariable.project_id,
                    tx_id: tx_id,
                    task_creator: myVariable.group,
                    task_name: task_name,
                    task_label: task_label,
                    task_description: task_description,
                    task_date: task_date,
                    task_sub_group: task_sub_group,
                    task_array_map: task_array_map,
                    task_type: taskType,
                  },
                ])
                .select(`contribution_id`)
                .single();
          
              if (error) throw error;
          
              const data = insertResult as unknown as ContributionInsertResult;
              const contribution_id: string | null = data && data.contribution_id ? data.contribution_id : null;
          
              for (const contributorKey in contribution.contributors) {
                const walletAddress = Object.keys(myVariable.txamounts).find(key => key.endsWith(contributorKey));
                if (walletAddress) {
                  const contributor_id = await updateContributors(walletAddress, contributorKey);
          
                  const tokens: string[] = [];
                  const amounts: number[] = [];
          
                  for (const token in contribution.contributors[contributorKey]) {
                    tokens.push(token);
                    amounts.push(Number(contribution.contributors[contributorKey][token]));
                  }
          
                  const { error: distributionError } = await supabase
                    .from('distributions')
                    .insert([
                      {
                        tx_id,
                        contribution_id,
                        project_id: myVariable.project_id,
                        contributor_id,
                        tokens,
                        amounts,
                      },
                    ]);
          
                  if (distributionError) throw distributionError;
                }
              }
            }
          }          
      
        let { tx_id } = await updateTransactions(myVariable, thash);
        let customFileContent = ''
        let newMetaData = metaData
        newMetaData['txid'] = thash
        customFileContent = `${JSON.stringify(newMetaData, null, 2)}`; 
        await commitFile(customFilePath, customFileContent)  
        await updateContributionsAndDistributions(myVariable, tx_id, metaData); 
        if (myVariable.send_message == true) {
          await sendDiscordMessage(myVariable);
        }
        //await checkAndUpdate(myVariable, thash);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Operation completed successfully." }),
  };
};

export { handler };
// ../functions/processTransaction.ts
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

async function updateTransactions(myVariable: any, thash: any, metaData: any, isFaultyTxFilter: boolean, total_tokens: string[], total_amounts: number[], customFilePath: string) {
  try {
    let recipients = 0; // Initialize as number
    const adaObject = myVariable.walletBalanceAfterTx.find((obj: any) => obj.name === 'ADA');
    const adaBalance = adaObject ? parseFloat(adaObject.amount) || 0 : 0;
    const recipientsMsg = metaData.msg.find((msg: string) => msg.startsWith("Recipients: "));
    if (recipientsMsg) {
      const numberOfRecipients = recipientsMsg.split(' ')[1];
      recipients = parseInt(numberOfRecipients, 10) || 0; // Parse as integer, default to 0 if NaN
    }

    // Ensure numeric fields have valid values or defaults
    const fee = parseInt(myVariable.fee, 10) || 0;
    const exchange_rate = parseFloat(myVariable.tokenRates.ADA) || 0;
    const total_ada = parseFloat(myVariable.totalAmounts.ADA) || 0;
    const monthly_budget_balance = myVariable.monthly_budget_balance || {};

    const { data: insertResult, error } = await supabase
    .from("transactions")
    .insert([
      { 
        transaction_id: thash, 
        transaction_date: new Date().getTime().toString(),
        wallet_balance_after: adaBalance, 
        md_version: metaData.mdVersion[0] || '',
        tx_json: metaData,
        tx_json_url: `https://raw.githubusercontent.com/treasuryguild/treasury-system-v4/main/${customFilePath}`,
        exchange_rate: exchange_rate,
        recipients: recipients, // Now a number
        fee: fee,
        tx_type: isFaultyTxFilter ? "FaultyTx-Filter" : myVariable.txtype,
        total_ada: total_ada,
        project_id: myVariable.project_id,
        total_tokens: total_tokens,
        total_amounts: total_amounts,
        monthly_budget_balance: JSON.stringify(monthly_budget_balance) // Convert object to string
      }
    ])
    .select(`tx_id`)
    .single();

    if (error) throw error;
    const data = insertResult as unknown as Transaction;

    const tx_id: string | null = data && data.tx_id ? data.tx_id : null;

    console.log("Transaction updated successfully. tx_id:", tx_id);
    return { tx_id };
  } catch (error) {
    console.error("Error in updateTransactions:", error);
    throw error;
  }
}

async function updateContributors(walletAddress: string, contributorKey: string) {
  try {
    const { error } = await supabase
      .from("contributors")
      .upsert([
        { 
          contributor_id: contributorKey, 
          wallet: walletAddress
        }
      ]);
  
    if (error) throw error;
    console.log("Contributor updated successfully:", contributorKey);
    return contributorKey;
  } catch (error) {
    console.error("Error in updateContributors:", error);
    throw error;
  }
}

async function updateContributions(tx_id: any, isFaultyTxFilter: boolean, myVariable: any, metaData: any) {
  try {
    if (isFaultyTxFilter) {
      console.log("Inserting default contribution for FaultyTx-Filter");
      const { data, error } = await supabase
        .from('contributions')
        .insert([
          {
            project_id: myVariable.project_id,
            tx_id,
            task_creator: "System",
            task_name: "FaultyTx-Filter",
            task_label: "FaultyTx-Filter",
            task_description: "Addresses the invalidation or filtration of faulty transactions",
            task_date: new Date().toISOString().split('T')[0],
            task_sub_group: "System",
            task_array_map: null,
            task_type: "FaultyTx-Filter"
          }
        ])
        .select('contribution_id');

      if (error) throw error;
      console.log("Default contribution inserted:", data[0].contribution_id);
      return [data[0].contribution_id];
    } else {
      console.log("Updating contributions for normal transaction");
      const promises = metaData.contributions.map(async (contribution: any) => {
        const task_name = contribution.name ? contribution.name.join(' ') : null;
        const task_date = contribution?.arrayMap?.date?.join(',') || null;
        const task_sub_group = contribution?.arrayMap?.subGroup?.join(',') || null;
        const task_array_map = contribution.arrayMap ? contribution.arrayMap : null;
        const task_description = contribution.description ? contribution.description.join(' ') : null;
        const task_label = (contribution?.arrayMap?.label && contribution.arrayMap.label.length > 0) ? contribution.arrayMap.label.join(',') : (Array.isArray(contribution.label) ? contribution.label.join(',') : (contribution.label ? contribution.label : null));
          
        let taskType: any = '';
        if (myVariable.txtype == "Incoming" || task_label == 'Incoming') {
          taskType = "Incoming";
        } else {
          taskType = myVariable.txtype 
        }

        const updates = {
          project_id: myVariable.project_id,
          tx_id,
          task_creator: myVariable.group,
          task_name: task_name,
          task_label: task_label,
          task_description: task_description,
          task_date: task_date,
          task_sub_group: task_sub_group,
          task_array_map: task_array_map,
          task_type: taskType,
        }
        const { data, error } = await supabase
          .from('contributions')
          .upsert([ 
            updates
          ])
          .select('contribution_id');

        if (error) throw error;

        return data[0].contribution_id; 
      });

      const results = await Promise.all(promises);
      console.log("Contributions updated successfully:", results);
      return results;
    }
  } catch (error) {
    console.error("Error in updateContributions:", error);
    throw error;
  }
}

async function updateDistributions(contribution_ids: any, tx_id: any, isFaultyTxFilter: boolean, myVariable: any, metaData: any) {
  try {
    if (isFaultyTxFilter) {
      console.log("Inserting default distribution for FaultyTx-Filter");
      await supabase
        .from('distributions')
        .insert([
          {
            contributor_id: "System",
            tokens: ["ADA"],
            amounts: [0],
            contribution_id: contribution_ids[0],
            project_id: myVariable.project_id,
            tx_id
          }
        ]);
      console.log("Default distribution inserted successfully");
    } else {
      console.log("Updating distributions for normal transaction");
      const promises = metaData.contributions.map(async (contribution: any, index: any) => {
        const contribution_id = contribution_ids[index];
  
        for (const contributor in contribution.contributors) {
          const walletAddress: any = Object.keys(myVariable.txamounts).find(key => key.endsWith(contributor));
          const contributor_id = await updateContributors(walletAddress, contributor);
          const tokensObj = contribution.contributors[contributor];
          let tokensArray = [];
          let amountsArray = [];
  
          for (const token in tokensObj) {
            const amount = tokensObj[token];
            if (token == 'gimbal') {
              tokensArray.push('GMBL');
            } else {
              tokensArray.push(token);
            }
            
            amountsArray.push(amount);
          }
          const updates = { 
            contributor_id, 
            tokens: tokensArray, 
            amounts: amountsArray, 
            contribution_id,
            project_id: myVariable.project_id,
            tx_id
          }
  
          await supabase
            .from('distributions')
            .upsert([updates]);
        }
      });
  
      await Promise.all(promises);
      console.log("Distributions updated successfully");
    }
  } catch (error) {
    console.error("Error in updateDistributions:", error);
    throw error;
  }
}

const handler: Handler = async (event: any, context: any) => {
  try {
    console.log("Function started. Event body:", event.body);

    const { thash, myVariable, customFilePath, metaData } = JSON.parse(event.body);

    console.log("Parsed event data:", { thash, myVariable, customFilePath, metaData });

    const total_tokens = Object.keys(myVariable.totalAmounts);
    const total_amounts: any = Object.values(myVariable.totalAmounts);
    
    const isFaultyTxFilter = metaData.msg.includes("FaultyTx-Filter");
    console.log("Is FaultyTx-Filter:", isFaultyTxFilter);

    console.log("Starting transaction update");
    let { tx_id } = await updateTransactions(myVariable, thash, metaData, isFaultyTxFilter, total_tokens, total_amounts, customFilePath);
    console.log("Transaction update completed. tx_id:", tx_id);

    console.log("Preparing custom file content");
    let customFileContent = ''
    let newMetaData = metaData
    newMetaData['txid'] = thash
    customFileContent = `${JSON.stringify(newMetaData, null, 2)}`;

    console.log("Committing file");
    await commitFile(customFilePath, customFileContent);
    console.log("File committed successfully");

    console.log("Updating contributions");
    const contribution_ids = await updateContributions(tx_id, isFaultyTxFilter, myVariable, metaData);
    console.log("Contributions updated. IDs:", contribution_ids);

    console.log("Updating distributions");
    await updateDistributions(contribution_ids, tx_id, isFaultyTxFilter, myVariable, metaData);
    console.log("Distributions updated successfully");

    if (myVariable.send_message == true && !isFaultyTxFilter) {
      console.log("Sending Discord message");
      await sendDiscordMessage(myVariable);
      console.log("Discord message sent");
    }

    //await checkAndUpdate(myVariable, thash);

    console.log("Function completed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Operation completed successfully." }),
    };
  } catch (error: any) {
    console.error("Unhandled error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error occurred", error: error.message }),
    };
  }
};

export { handler };
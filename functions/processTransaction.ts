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

    const { thash, myVariable, customFilePath, metaData } = JSON.parse(event.body)

        function getTaskType(name: any, label: any, description: any) {
          var tasktypes: any = {
            "Operations":["Operations","PM Meeting","Video Meeting","Marketing Call","Weekly call - Treasury Guild Team","Weekly Call - Swarm & Treasury Guild","Setting up","set up","Schedule","setup","Organiz","gdrive","miro","Community Suggestion","Management","Transactions","Install","treasury","administration-of-budget","administration of budget","general admin", "remuneration", "salary", "payments", "leftover","test wallet","Other","budget administration","operational","research","preparation","move to exchange"],
            "Swarm Session":["Swarm Session","Join Saturday Swarm Session"],
            "Insight fest":["Insight fest"],
            "Content Creation":["Content Creation","article","Poetry","create","creating","Promotion","videocreation","Translat","Clip & Edit","translat","videos","content shared","Town Hall Slides"],
            "ATH Participation":["ATH Participation","join us at After Town Hall"],
            "Onboarding":["Onboarding","Onboard","Mentorship","workshop"],
            "Timestamping":["Timestamping","timestamp"],
            "Documentation":["Documentation","How to","Report","mapping","Walkthrough"],
            "Community Communication":["Community Communication","weekly call","Hosts","coordinat","Ambassador Town Hall","weekly meeting","community council","meeting","session","Facilitate","Announce","attendees"],
            "Governance":["Governance","voting"],
            "Tool Development":["Tool Development","MVP","Discord Server","Integrate","Add csv features","metadata"],
            "Ideation":["Ideation","Suggest"],
            "Voting":["voting registration","voting"],
            "Staking":["Staking to pool","Stake to pool", "Staked to pool","stake to stake pool", "Payment for staking funds","Transaction fee for staking", "Staking fees", "Staking to", "Staking fee", "pool fees", "staking pool fees"],
            "Donation":["sent donation", "send donation", "donation sent"],
            "Incentive Budget":["new lead","verified cross-chain lead","verified lead", "generated lead", "confirmed collaboration", "lead collaboration", "support participation","Funded-proposer","Toolmakers-and-maintainers","Stake-Pool-Operators","General-ADA-Holder","Community-Advisors","Funded proposer","Toolmakers and maintainers","Stake Pool Operators","General ADA Holder","Community Advisors","Swarm bounties - CC Logo","funds to pay for CC Bounties","incentives"],
            "Fixed costs":["Fixed costs","Comm Org Tools","Zoom","GitBook", "comm-org-tools", "expenses", "costs"],
            "Internal transfer":["Internal wallet transfer","Internal transfer"],
            "Rewards Withdrawal":["Rewards-Withdrawal","Internal wallet transfer and staking rewards","staking rewards", "Stake rewards", "Stake Pool Rewards","Withdrawal staking reward funds"],
            "Incoming":["Incoming","IOG", "received donation", "donation received"]
          }
      
          let finalResult = "";
          for (let i in tasktypes) {
            tasktypes[i].forEach((partialWord: string) => {
              let regex = new RegExp(partialWord.toLowerCase());
              if (description && regex.test(description.toLowerCase())) {
                finalResult = i;
              }
              if (name && regex.test(name.toLowerCase())) {
                finalResult = i;
              }
              if (label && regex.test(label.toLowerCase())) {
                finalResult = i;
              }    
            });
          }
        
          return finalResult;
        }
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
                  total_amounts: total_amounts
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
              const task_description = contribution.description ? contribution.description.join(' ') : null;
          
              let taskType: any = '';
              const task_label = Array.isArray(contribution.label) ? contribution.label.join(',') : contribution.label;
              if (myVariable.txtype == "Incoming" || task_label == 'Incoming') {
                taskType = "Incoming";
              } else {
                taskType = getTaskType(task_name, task_label, task_description);
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
        await sendDiscordMessage(myVariable);
        await checkAndUpdate(myVariable, thash);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Operation completed successfully." }),
  };
};

export { handler };
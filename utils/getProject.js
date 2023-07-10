import { supabase } from "../lib/supabaseClient";

export async function getProject(address) {
    let project = []
    let projectname = ''
    let projectWebsite = ''
    let projectId = ''
    let groupInfo = {}
    let monthly_budget_balance = {}
      try {
        const { data, error, status } = await supabase
        .from("projects")
        .select('project_name, project_type, project_id, website, groups(group_name, logo_url)')
        .eq("wallet", address)

        const lastTransaction = await supabase
        .from("transactions")
        .select("monthly_budget_balance, created_at")
        .eq("project_id", data[0].project_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
        //console.log(data, lastTransaction.data)
        if (error && status !== 406) throw error
        if (data) {
          project = data
          if (project.length == 0) {
            projectname = ''
            groupInfo = {}
          } else {
            projectname = project[0].project_name;
            projectWebsite = project[0].website;
            projectId = project[0].project_id;
            monthly_budget_balance = lastTransaction.data[0].monthly_budget_balance
            groupInfo = JSON.parse(`{"group":"${project[0]['groups'].group_name}","project":"${project[0].project_name}","project_id":"${project[0].project_id}","project_type":"${project[0].project_type}","project_website":"${project[0].website}","logo_url":"${project[0]['groups'].logo_url}"}`)
            groupInfo["monthly_budget_balance"] = monthly_budget_balance
          }
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
      //console.log(groupInfo, monthly_budget_balance)
    return groupInfo
  }
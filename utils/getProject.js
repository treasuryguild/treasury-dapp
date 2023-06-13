import { supabase } from "../lib/supabaseClient";

export async function getProject(address) {
    let project = []
    let projectname = ''
    let projectWebsite = ''
    let projectId = ''
    let groupInfo = {}
      try {
        const { data, error, status } = await supabase
        .from("projects")
        .select('project_name, project_type, project_id, website, groups(group_name, logo_url)')
        .eq("wallet", address);

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
            groupInfo = JSON.parse(`{"group":"${project[0]['groups'].group_name}","project":"${project[0].project_name}","project_id":"${project[0].project_id}","project_type":"${project[0].project_type}","project_website":"${project[0].website}","logo_url":"${project[0]['groups'].logo_url}"}`)
          }
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    return groupInfo
  }
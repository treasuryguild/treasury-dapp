import { supabase } from "../lib/supabaseClient";

export async function setSubGroups(inputSubGroups, project_id) {
  async function updateSubGroups(inputSubGroups) {
    let status = 'started';
    
    // Fetch all existing SubGroups from the database
    const { data: existingSubGroups, error: fetchError } = await supabase
      .from("subgroups")
      .select("sub_group");
      
    if (fetchError) throw fetchError;

    // Convert the existing SubGroups to a Set for faster lookup
    const existingSubGroupsSet = new Set(existingSubGroups.map(item => item.sub_group));

    // Filter out the SubGroups that already exist
    const newSubGroups = inputSubGroups.filter(sub_group => !existingSubGroupsSet.has(sub_group));

    // Insert new labels
    for (const sub_group of newSubGroups) {
      const updates = {
        sub_group,
        project_id
      };

      const { data, error } = await supabase
        .from("subgroups")
        .upsert(updates)
        .select('*');

      if (error) throw error;

      if (!data) {
        throw new Error("Failed to update the label");
      }
    }

    status = 'done';
    return status;
  }

  const { status } = await updateSubGroups(inputSubGroups);
  return status;
}

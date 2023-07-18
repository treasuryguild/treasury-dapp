import axios from 'axios';
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type Group = {
  group_id: string;
  group_name: string;
};

type GroupData = {
  group_name: string;
  // Add other properties of the group object as needed
};

type ProjectData = {
  project_name: string;
  wallet: string;
  // Add other properties of the project object as needed
};

export async function newWallet(groupData: any, projectData: any) {
  async function getGroupByName(groupName: string) {
    const { data: groups, error } = await supabase
        .from("groups")
        .select("*")
        .eq("group_name", groupName);
      
    if (error) throw error;
      
    return groups && groups.length > 0 ? groups[0] : null;
  }

      
      async function updateGroup(groupData: GroupData, groupId: string): Promise<Group> {
        const updates = {
            group_name: groupData.group_name,
            updated_at: new Date()
        }
        
        let { data, error } = await supabase
            .from("groups")
            .upsert({ ...updates, group_id: groupId })
            .select('*')
        
        if (error) throw error;
        
        if (data) {
            const groupArray = data as Group[];
            if (groupArray.length === 0) {
                throw new Error("Failed to update the group");
            }
            return groupArray[0];
        } else {
            throw new Error("Failed to update the group");
        }
    }    
    
      
    async function createGroup(groupData: GroupData): Promise<Group> {
      console.log("Creating group with data: ", groupData);
    
      const { data, error } = await supabase
          .from("groups")
          .insert(groupData)
          .single();
    
      console.log("Insertion result: ", { data, error });
    
      if (error) {
        console.error(error);
        throw error;
      }
    
      if (data) {
        return data as Group;
      } else {
        // If data is null, assume the insertion succeeded and query for the inserted group.
        console.log("Data is null after insertion, querying for inserted group.");
    
        const { data: fetchedGroup, error: fetchError } = await supabase
            .from("groups")
            .select("*")
            .eq("group_name", groupData.group_name)
            .single();
    
        if (fetchError) {
          console.error(fetchError);
          throw fetchError;
        }
    
        if (fetchedGroup) {
          return fetchedGroup as Group;
        } else {
          throw new Error("Failed to fetch the created group.");
        }
      }
    }    
    
       
      async function insertOrUpdateProject(projectData: ProjectData, groupId: string) {
        // Check if projectData.wallet exists in 'projects'
        const { data: existingProjects, error: error1 } = await supabase
          .from("projects")
          .select("*")
          .eq("wallet", projectData.wallet);
      
        if (error1) throw error1;
      
        if (existingProjects && existingProjects.length > 0) {
          // Update existing project with new info
          const { error: error2 } = await supabase
            .from("projects")
            .update({ ...projectData, group_id: groupId })
            .eq("wallet", projectData.wallet);
          
          if (error2) throw error2;
        } else {
          // Insert new project
          const { error: error3 } = await supabase
            .from("projects")
            .insert({ ...projectData, group_id: groupId });
      
          if (error3) throw error3;
        }
      }
      
      async function updateProject(groupData: GroupData, projectData: ProjectData) {
        console.log(groupData, projectData);
        let existingGroup;
        try {
            existingGroup = await getGroupByName(groupData.group_name);
        } catch (error) {
            console.error("Could not fetch the group, creating a new one", error);
        }
    
        let groupId;
    
        if (existingGroup) {
            groupId = (await updateGroup(groupData, existingGroup.group_id)).group_id;
        } else {
          console.log("groupData", groupData)
            groupId = (await createGroup(groupData)).group_id;
        }
    
        console.log("passed");
        try {
            await insertOrUpdateProject(projectData, groupId);
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                console.error("Unknown error:", error);
            }
        }
    }    
    
      return await updateProject(groupData, projectData)
  }
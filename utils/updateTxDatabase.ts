import axios from 'axios';
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { KoiosProvider } from '@meshsdk/core';

const koios = new KoiosProvider('api');

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

export async function updateTxDatabase(myVariable:any, metaData:any, thash: any) {
    async function getGroupByName(groupName: string) {
        const { data: existingGroup, error } = await supabase
          .from("groups")
          .select("*")
          .eq("group_name", groupName)
          .single();
      
        if (error) throw error;
        console.log('existingGroup',error,existingGroup)
      
        return existingGroup;
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
            .single()
      
        if (error) throw error;
        console.log("updateGroup", error, data)
      
        if (!data) {
            throw new Error("Failed to update the group");
        }
        console.log("updateGroup data", data)
        return data as Group;
    }
      
      async function createGroup(groupData: GroupData): Promise<Group> {
        const { data, error } = await supabase
          .from("groups")
          .upsert(groupData);
      
        if (error) throw error;
        console.log(error)
        if (!data) {
          throw new Error("Failed to update the group");
        }
      
        return data as Group;
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
      
      async function updateProject(myVariable:any, metaData:any, thash: any) {
        console.log("UpdateTxDatabase",myVariable, metaData, thash);
        let test = await koios.fetchTxInfo(
          '6f7d9f62fde667861ff07365e3fba6b0af650867e84c6f36a6043e910a123885',
        )
        console.log("test koios",test, myVariable.txamounts)
        /*try {
          const existingGroup = await getGroupByName(groupData.group_name);
          const groupId = existingGroup
            ? (await updateGroup(groupData, existingGroup.group_id)).group_id
            : (await createGroup(groupData)).group_id;
          console.log("passed");
          await insertOrUpdateProject(projectData, groupId);
        } catch (error) {
          if (error instanceof Error) {
            alert(error.message);
          } else {
            console.error("Unknown error:", error);
          }
        }*/
      }
      return await updateProject(myVariable, metaData, thash)
  }
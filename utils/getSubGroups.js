import { supabase } from "../lib/supabaseClient";

export async function getSubGroups() {
    let subgroups = []
      try {
        const { data, error, status } = await supabase
        .from("subgroups")
        .select('sub_group')

        if (error && status !== 406) throw error
        if (data) {
          //console.log(data)
          subgroups = data
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    return subgroups
  }
import { supabase } from "../lib/supabaseClient";

export async function getLabels() {
    let labels = []
      try {
        const { data, error, status } = await supabase
        .from("labels")
        .select('label')

        if (error && status !== 406) throw error
        if (data) {
          //console.log(data)
          labels = data
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    return labels
  }
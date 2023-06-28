import { supabase } from "../lib/supabaseClient";

export async function setLabels(labels) {

    async function updateLabels(labels) {
        let status = 'started'
        for (let i in labels) {
            const updates = {
                label: labels[i],
            }
    
            let { data, error } = await supabase
                .from("labels")
                .upsert( updates )
                .select('*')
          
            if (error) throw error;
            console.log("updateLabel", error, data)
          
            if (!data) {
                throw new Error("Failed to update the label");
            }
            console.log("updateLabel data", data)
        }
        status = 'done'
        return status
    }
  let { status } = await updateLabels(labels);
  return status
}

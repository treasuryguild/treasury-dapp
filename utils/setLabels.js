import { supabase } from "../lib/supabaseClient";

export async function setLabels(inputLabels) {
  async function updateLabels(inputLabels) {
    let status = 'started';
    
    // Fetch all existing labels from the database
    const { data: existingLabels, error: fetchError } = await supabase
      .from("labels")
      .select("label");
      
    if (fetchError) throw fetchError;

    // Convert the existing labels to a Set for faster lookup
    const existingLabelSet = new Set(existingLabels.map(item => item.label));

    // Filter out the labels that already exist
    const newLabels = inputLabels.filter(label => !existingLabelSet.has(label));

    // Insert new labels
    for (const label of newLabels) {
      const updates = {
        label,
      };

      const { data, error } = await supabase
        .from("labels")
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

  const { status } = await updateLabels(inputLabels);
  return status;
}

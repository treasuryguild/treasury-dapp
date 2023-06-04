import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  
    try {
      const tx_id = req.body.record.tx_id;
      const txhash = req.body.record.transaction_id;

      const { data, error } = await supabase
        .from("projects")
        .select('project_name, project_type, groups(group_name)')
        .eq("wallet", wallet);

      if (error) {
        throw error;
      }

      const { data2, error2 } = await supabase
      .from("transactioninfo")
      .upsert([
        { 
          tx_id: tx_id, 
          txhash: txhash,
          txfilepath: data.project_name
        }
      ]);
  
    if (error2) throw error2;
      console.log("api data",data)

      res.status(200).json(data2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}
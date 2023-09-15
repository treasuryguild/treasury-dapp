import supabase from "../../lib/supabaseClient";

export default async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('wallets')
      .select('wallet, username, full_username, project');
    
    if (error) throw error;

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

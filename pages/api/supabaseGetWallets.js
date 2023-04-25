import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const wallet = req.query.wallet;

      const { data, error } = await supabase
        .from("projects")
        .select('project_name, project_type, groups(group_name)')
        .eq("wallet", wallet);

      if (error) {
        throw error;
      }
      console.log("api data",data)
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
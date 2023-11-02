import { supabase } from "../lib/supabaseClient";

export async function setTokenTypes(tokens) {
    async function updateTokens(tokens) {
      let status = 'started';
  
      // Fetch all existing labels from the database
      const { data: existingTokens, error: fetchError } = await supabase
        .from("tokens")
        .select("policy_id");
  
      if (fetchError) throw fetchError;
  
      // Convert the existing tokens to a Set for faster lookup
      const existingTokenSet = new Set(existingTokens.map(item => item.policy_id));
  
      // Filter out the tokens that already exist
      const newTokens = tokens.filter(token => !existingTokenSet.has(token.policy_id));
      
      // Insert new tokens
      for (const token of newTokens) {
        let decimals = token.decimals || 0;
        const updates = {
          unit: token.unit,
          policy_id: token.policy_id,
          asset_name: token.displayname,
          ticker: token.name,
          asset_type: token.tokenType,
          decimals: decimals,
          fingerprint: token.fingerprint,
        };
  
        const { data, error } = await supabase
          .from("tokens")
          .upsert(updates)
          .select('*');
  
        if (error) throw error;
  
        if (!data) {
          throw new Error("Failed to update the token");
        }
      }
  
      status = 'done';
      return status;
    }
  
    const status = await updateTokens(tokens);
    return status;
  }
  
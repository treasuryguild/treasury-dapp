import { supabase } from "../lib/supabaseClient";

export async function getGroups() {
    try {
        const { data, error, status } = await supabase
            .from('groups') 
            .select('*'); 

        if (error && status !== 406) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching groups:', error.message || error);
        return []; 
    }
}

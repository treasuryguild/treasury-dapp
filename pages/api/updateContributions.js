import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
    try {
        const tx_id = req.body.record.tx_id;
        const txhash = req.body.record.transaction_id;

        const { data, error } = await supabase
            .from("transactions")
            .select('transaction_id, wallet_balance_after')
            .eq("tx_id", tx_id);

        if (error) {
            throw error;
        }

        const wallet_balance_after = data[0].wallet_balance_after?data[0].wallet_balance_after:0;

        const { data: data2, error: error2 } = await supabase
            .from("transactioninfo")
            .upsert([
                {
                    tx_id: tx_id,
                    txhash: txhash,
                    txfilepath: wallet_balance_after
                }
            ]);

        if (error2) throw error2;
        console.log("api data", data)

        res.status(200).json(data2);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

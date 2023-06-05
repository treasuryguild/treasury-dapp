import updateTxDatabase from '../../utils/updateTxDatabase'

export default async function handler(req, res) {
    try {
        const txhash = req.body.record.txhash;
        const myVariable = req.body.record.txinfo;
        const customFilePath = req.body.record.txfilepath;
        const metaData = req.body.record.metadata;
        await updateTxDatabase(myVariable, metaData, txhash, customFilePath)

        res.status(200).json({message: "Success"});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

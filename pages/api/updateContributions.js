import updateTxDatabase from '../../utils/updateTxDatabase'

export default async function handler(req, res) {
        const txhash = req.body.record.txhash;
        const myVariable = req.body.record.txinfo;
        const customFilePath = req.body.record.txfilepath;
        const metaData = req.body.record.metadata;
        await updateTxDatabase(myVariable, metaData, txhash, customFilePath)
}

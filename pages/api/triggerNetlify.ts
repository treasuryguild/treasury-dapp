import axios from 'axios';

export default async function handler(req: any, res: any) {
  const thash = req.body.record.txhash;
  const myVariable = req.body.record.txinfo;
  const customFilePath = req.body.record.txfilepath;
  const metaData = req.body.record.metadata;
  
  try {
    const response = await axios.post('https://lambent-kelpie-e8b15c.netlify.app/.netlify/functions/processTransaction', {
      thash,
      myVariable,
      customFilePath,
      metaData
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export default async function handler(req: any, res: any) {
  const thash = req.body.record.txhash;
  const myVariable = req.body.record.txinfo;
  const customFilePath = req.body.record.txfilepath;
  const metaData = req.body.record.metadata;
  const response = await fetch('https://lambent-kelpie-e8b15c.netlify.app/.netlify/functions/processTransaction', {
    method: 'POST',
    body: JSON.stringify({
      thash,
      myVariable,
      customFilePath,
      metaData
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  res.status(200).json(data)
}
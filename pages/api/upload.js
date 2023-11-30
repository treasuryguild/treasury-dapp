// pages/api/upload.js
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('API route called');

  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing the form:', err);
        res.status(500).json({ error: 'Error parsing the file' });
        return;
      }
  
      try {
        console.log('Files:', files);
  
        const storage = new ThirdwebStorage({
          secretKey: process.env.NFT_API_KEY, 
        });
  
        const file = files.file[0];
        const fileContent = fs.readFileSync(file.filepath);
        const uploadUrl = await storage.upload(fileContent);
        console.log('Upload URL:', uploadUrl);
  
        res.status(200).json({ url: uploadUrl });
      } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ error: error.message || 'Error uploading to IPFS', detailedError: error });
      }      
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

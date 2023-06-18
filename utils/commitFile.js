//https://lambent-kelpie-e8b15c.netlify.app/api/commit
import axios from 'axios';

export async function commitFile(filePath, fileContent) {
    const commitMessage = 'Transaction';
  
    try {
      const response = await axios.post('https://lambent-kelpie-e8b15c.netlify.app/api/commit', { filePath, fileContent, commitMessage }, { 
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.status !== 200) {
        throw new Error('Error committing file');
      }
  
      console.log(response.data.message);
    } catch (error) {
      console.error('Error committing file to GitHub:', error);
    }
  }

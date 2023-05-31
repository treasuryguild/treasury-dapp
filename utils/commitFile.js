export async function commitFile(filePath, fileContent) {
    const commitMessage = 'Transaction';
  
    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, fileContent, commitMessage }),
      });
  
      if (!response.ok) {
        throw new Error('Error committing file');
      }
  
      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error('Error committing file to GitHub:', error);
    }
  }
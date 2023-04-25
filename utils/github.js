import axios from 'axios';

export async function commitFileToGitHub(token, repoOwner, repoName, filePath, fileContent, commitMessage) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
  };

  const mainBranch = 'main';
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;

  try {
    // Get the latest commit of the main branch
    const latestCommitRes = await axios.get(`${apiUrl}/git/ref/heads/${mainBranch}`, { headers });
    const latestCommitSha = latestCommitRes.data.object.sha;

    // Get the tree of the latest commit
    const latestCommitTreeRes = await axios.get(`${apiUrl}/git/trees/${latestCommitSha}`, { headers });
    const latestCommitTreeSha = latestCommitTreeRes.data.sha;

    // Create a new blob with the file content
    const blobRes = await axios.post(`${apiUrl}/git/blobs`, { content: fileContent, encoding: 'utf-8' }, { headers });
    const blobSha = blobRes.data.sha;

    // Create a new tree with the new file
    const newTreeRes = await axios.post(`${apiUrl}/git/trees`, {
      base_tree: latestCommitTreeSha,
      tree: [
        {
          path: filePath,
          mode: '100644', // Regular file
          type: 'blob',
          sha: blobSha,
        },
      ],
    }, { headers });
    const newTreeSha = newTreeRes.data.sha;

    // Create a new commit
    const newCommitRes = await axios.post(`${apiUrl}/git/commits`, {
      message: commitMessage,
      parents: [latestCommitSha],
      tree: newTreeSha,
    }, { headers });
    const newCommitSha = newCommitRes.data.sha;

    // Update the main branch reference to point to the new commit
    await axios.patch(`${apiUrl}/git/refs/heads/${mainBranch}`, { sha: newCommitSha }, { headers });
  } catch (error) {
    console.error('Error committing file to GitHub:', error);
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { commitFileToGitHub } from '../../utils/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const repoOwner = 'treasuryguild';
  const repoName = 'treasury-system-v4';

  const filePath = req.body.filePath;
  const fileContent = req.body.fileContent;
  const commitMessage = req.body.commitMessage;

  try {
    await commitFileToGitHub(GITHUB_TOKEN, repoOwner, repoName, filePath, fileContent, commitMessage);
    res.status(200).json({ message: 'File committed successfully' });
  } catch (error) {
    console.error('Error committing file to GitHub:', error);
    res.status(500).json({ message: 'Error committing file to GitHub' });
  }
}

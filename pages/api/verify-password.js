export default function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    const { password } = req.body;
  
    if (!password) {
      return res.status(400).json({ message: 'Missing password' });
    }
  
    // Replace 'your-password' with the actual password you want to check against
    if (password === 'your-password') {
      return res.status(200).json({ message: 'Password is correct' });
    } else {
      return res.status(401).json({ message: 'Invalid password' });
    }
  }
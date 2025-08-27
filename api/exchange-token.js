import fetch from 'node-fetch';

const CLIENT_ID = 'ba9385bd54cc4ba3b297ce5fca852fd9';
const CLIENT_SECRET = 'a636c32c9c654e92ae32bda3cfd1295eT'; // tu Client Secret
const REDIRECT_URI = 'https://invitacion-xv-seven.vercel.app/';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const headers = {
    'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers,
      body
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

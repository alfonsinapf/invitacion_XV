import fetch from 'node-fetch';

export default async function handler(req, res) {
  const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  // 1️⃣ Obtener access_token desde refresh_token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
               'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
             },
    body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // 2️⃣ Hacer búsqueda
  const { query } = req.body;
  const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const searchData = await searchResponse.json();

  res.status(200).json({ tracks: searchData.tracks.items });
}

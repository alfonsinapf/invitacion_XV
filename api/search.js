import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    // Obtener access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Búsqueda de canciones
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No se indicó query' });

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchResponse.json();

    res.status(200).json({ tracks: searchData.tracks.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
}

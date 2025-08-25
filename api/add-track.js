import fetch from 'node-fetch';

const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_SECRET';
const REFRESH_TOKEN = 'TU_REFRESH_TOKEN'; // Obtenido con JustSpotify o Authorization Code Flow

export default async function handler(req, res) {
  // 1️⃣ Obtener un Access Token válido
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN
    })
  });
  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;

  // 2️⃣ Endpoint: agregar canción a playlist
  if (req.method === 'POST') {
    const { playlistId, trackUri } = req.body;
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [trackUri] })
    });
    const data = await addRes.json();
    return res.status(200).json(data);
  }

  // 3️⃣ Solo devolver access token si GET
  res.status(200).json({ access_token });
}

import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const PLAYLIST_ID = process.env.PLAYLIST_ID;

    const { trackUri } = req.body;
    if (!trackUri) return res.status(400).json({ error: 'No se indicó trackUri' });

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

    // Agregar canción
    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [trackUri] })
    });

    if (addResponse.ok) {
      res.status(200).json({ success: true });
    } else {
      const err = await addResponse.json();
      res.status(addResponse.status).json({ error: err });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error agregando canción' });
  }
}

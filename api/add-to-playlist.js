import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID; // ID de la playlist

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !PLAYLIST_ID) {
      console.error('❌ Variables de entorno faltantes');
      return res.status(500).json({ error: 'Variables de entorno faltantes' });
    }

    const { trackUri } = req.body;
    if (!trackUri) return res.status(400).json({ error: 'No se indicó trackUri' });

    // 1️⃣ Obtener access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ No se pudo obtener access token', tokenData);
      return res.status(500).json({ error: 'No se pudo obtener token de Spotify' });
    }

    const accessToken = tokenData.access_token;

    // 2️⃣ Agregar canción a la playlist
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri] })
      }
    );

    if (addResponse.status === 201 || addResponse.status === 200) {
      return res.status(200).json({ message: 'Canción agregada correctamente' });
    } else if (addResponse.status === 409) {
      return res.status(409).json({ message: 'La canción ya está en la playlist' });
    } else {
      const errorData = await addResponse.json();
      console.error('❌ Error al agregar a playlist:', errorData);
      return res.status(addResponse.status).json({ error: errorData.error?.message || 'Error al agregar a playlist' });
    }

  } catch (err) {
    console.error('❌ Error en /api/add-to-playlist:', err);
    res.status(500).json({ error: 'Error interno al agregar canción' });
  }
}

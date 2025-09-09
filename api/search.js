import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Faltan credenciales de Spotify' });
    }

    // Obtener access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Error obteniendo token:', errText);
      return res.status(500).json({ error: 'Error obteniendo token de Spotify' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error('No se obtuvo access_token:', tokenData);
      return res.status(500).json({ error: 'No se pudo obtener access token' });
    }

    // Búsqueda de canciones
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No se indicó query' });

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error('Error en búsqueda de Spotify:', errText);
      return res.status(500).json({ error: 'Error en búsqueda de Spotify' });
    }

    const searchData = await searchResponse.json();

    // Validar estructura de respuesta
    const tracks = searchData.tracks?.items || [];
    if (!tracks.length) {
      return res.status(404).json({ error: 'No se encontraron canciones', tracks: [] });
    }

    res.status(200).json({ tracks });
  } catch (err) {
    console.error('Error general en search.js:', err);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
}

import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN_OWNER;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('❌ Variables de entorno faltantes');
      return res.status(500).json({ error: 'Variables de entorno faltantes' });
    }

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

    // 2️⃣ Validar query
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No se indicó query' });

    // 3️⃣ Buscar canciones
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const searchData = await searchResponse.json();

    console.log('🎵 Respuesta Spotify:', searchData);

    // 4️⃣ Validar estructura antes de acceder a items
    const tracks = (searchData.tracks && Array.isArray(searchData.t

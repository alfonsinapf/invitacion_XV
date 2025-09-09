const fetch = require('node-fetch');
const { getAccessToken } = require('./spotify-token');

module.exports = async function handler(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No se indicó query' });

    // 1️⃣ Obtener access token directamente
    const accessToken = await getAccessToken();

    // 2️⃣ Buscar canciones en Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const searchData = await searchResponse.json();

    // 3️⃣ Validar estructura
    const tracks = (searchData.tracks && Array.isArray(searchData.tracks.items))
      ? searchData.tracks.items
      : [];

    return res.status(200).json({ tracks });
  } catch (error) {
    console.error('❌ Error en /api/search:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

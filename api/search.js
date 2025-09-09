const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No se indicó query' });

    // Obtener access token del endpoint de refresh
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify-token`);
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return res.status(500).json({ error: 'No se pudo obtener access token' });

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const searchData = await searchResponse.json();

    const tracks = (searchData.tracks && Array.isArray(searchData.tracks.items))
      ? searchData.tracks.items
      : [];

    return res.status(200).json({ tracks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { query } = req.body;
    const authHeader = req.headers.authorization;

    if (!query) {
      return res.status(400).json({ error: 'Falta el parámetro query' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorización requerido' });
    }

    const accessToken = authHeader.split(' ')[1];

    // Buscar canciones usando la API de Spotify
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=AR`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Spotify Search API Error:', searchData);
      return res.status(searchResponse.status).json({ 
        error: 'Error en la búsqueda de Spotify',
        details: searchData
      });
    }

    // Formatear respuesta
    const tracks = searchData.tracks?.items || [];
    
    return res.status(200).json({
      tracks: tracks,
      total: searchData.tracks?.total || 0
    });

  } catch (error) {
    console.error('Error en /api/search:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: error.message 
    });
  }
}

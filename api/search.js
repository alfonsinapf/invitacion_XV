// api/search.js - Búsqueda de canciones con autenticación automática
let serverToken = null;
let tokenExpiration = null;

async function getServerToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'ba9385bd54cc4ba3b297ce5fca852fd9';
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'a636c32c9c654e92ae32bda3cfd1295e';

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error de autenticación: ${data.error_description || data.error}`);
    }

    // Guardar token y tiempo de expiración
    serverToken = data.access_token;
    tokenExpiration = Date.now() + ((data.expires_in - 60) * 1000); // 60 segundos de margen

    return serverToken;
  } catch (error) {
    console.error('Error obteniendo token del servidor:', error);
    throw error;
  }
}

function isTokenValid() {
  return serverToken && tokenExpiration && Date.now() < tokenExpiration;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }

    // Verificar si necesitamos un token nuevo
    if (!isTokenValid()) {
      console.log('Obteniendo nuevo token del servidor...');
      await getServerToken();
    }

    // Buscar canciones usando la API de Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=12&market=AR`,
      {
        headers: {
          'Authorization': `Bearer ${serverToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      // Si el token expiró, intentar obtener uno nuevo
      if (searchResponse.status === 401) {
        console.log('Token expirado, obteniendo nuevo token...');
        await getServerToken();
        
        // Reintentar búsqueda con nuevo token
        const retryResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=12&market=AR`,
          {
            headers: {
              'Authorization': `Bearer ${serverToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!retryResponse.ok) {
          const retryData = await retryResponse.json();
          return res.status(retryResponse.status).json({ 
            error: 'Error en la búsqueda de Spotify',
            details: retryData
          });
        }
        
        const retrySearchData = await retryResponse.json();
        return res.status(200).json({
          tracks: retrySearchData.tracks?.items || [],
          total: retrySearchData.tracks?.total || 0
        });
      }

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
      total: searchData.tracks?.total || 0,
      message: `Se encontraron ${tracks.length} canciones`
    });

  } catch (error) {
    console.error('Error en /api/search:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: error.message 
    });
  }
}

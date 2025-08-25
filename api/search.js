export default async function handler(req, res) {
  // Configurar CORS para permitir requests desde el frontend
 res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}

  // Cambiar de GET a POST para coincidir con el frontend
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Obtener query del body en lugar de query params
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Falta query en el body" });
  }

  try {
    // Obtener token de acceso
    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");
    
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { 
        Authorization: `Basic ${auth}`, 
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: new URLSearchParams({ 
        grant_type: "refresh_token", 
        refresh_token: process.env.REFRESH_TOKEN 
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Error obteniendo token:", tokenData);
      return res.status(tokenRes.status).json({ 
        error: `Error de autenticación: ${tokenData.error_description || tokenData.error}` 
      });
    }

    const accessToken = tokenData.access_token;

    // Buscar canciones en Spotify
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=AR`;
    const searchRes = await fetch(searchUrl, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      console.error("Error en búsqueda:", searchData);
      return res.status(searchRes.status).json({ 
        error: `Error de búsqueda: ${searchData.error?.message || searchData.error}` 
      });
    }

    // Formatear resultados con toda la información necesaria para el frontend
    const tracks = searchData.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({ name: artist.name })),
      uri: track.uri,
      external_urls: track.external_urls,
      album: {
        name: track.album.name,
        images: track.album.images || []
      },
      preview_url: track.preview_url,
      duration_ms: track.duration_ms
    }));

    return res.status(200).json({ 
      tracks,
      total: searchData.tracks.total 
    });

  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({ 
      error: `Error interno del servidor: ${error.message}` 
    });
  }
}

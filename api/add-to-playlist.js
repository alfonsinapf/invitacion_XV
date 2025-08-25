export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

 if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { trackUri } = req.body;
    if (!trackUri) {
      return res.status(400).json({ error: "Falta trackUri en el body" });
    }

    // Validar formato del URI
    if (!trackUri.startsWith('spotify:track:')) {
      return res.status(400).json({ error: "Formato de URI inválido" });
    }

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

    // Verificar que el playlist existe y tenemos permisos
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!playlistRes.ok) {
      const playlistError = await playlistRes.json();
      console.error("Error verificando playlist:", playlistError);
      return res.status(playlistRes.status).json({ 
        error: `Error accediendo al playlist: ${playlistError.error?.message || playlistError.error}` 
      });
    }

    // Verificar si la canción ya está en el playlist
    const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks?limit=50`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (tracksRes.ok) {
      const tracksData = await tracksRes.json();
      const existingTrack = tracksData.items.find(item => item.track.uri === trackUri);
      
      if (existingTrack) {
        return res.status(409).json({ 
          error: "Esta canción ya está en la playlist",
          code: "TRACK_EXISTS"
        });
      }
    }

    // Añadir canción al playlist
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        uris: [trackUri],
        position: 0 // Añadir al inicio del playlist
      })
    });

    const result = await addRes.json();
    if (!addRes.ok) {
      console.error("Error añadiendo canción:", result);
      
      // Manejar errores específicos de Spotify
      if (result.error?.status === 403) {
        return res.status(403).json({ 
          error: "Sin permisos para modificar este playlist" 
        });
      }
      
      return res.status(addRes.status).json({ 
        error: `Error añadiendo canción: ${result.error?.message || result.error}` 
      });
    }

    return res.status(200).json({ 
      message: "Canción añadida exitosamente al playlist",
      snapshot_id: result.snapshot_id,
      trackUri 
    });

  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({ 
      error: `Error interno del servidor: ${error.message}` 
    });
  }
}

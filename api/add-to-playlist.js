// api/add-to-playlist.js - Agrega mejor logging
async function getAccessToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN || process.env.SPOTIFY_REFRESH_TOKEN;

  console.log('Variables disponibles:', {
    CLIENT_ID: CLIENT_ID ? '✅' : '❌',
    CLIENT_SECRET: CLIENT_SECRET ? '✅' : '❌', 
    REFRESH_TOKEN: REFRESH_TOKEN ? '✅' : '❌'
  });

  if (!CLIENT_ID) throw new Error("SPOTIFY_CLIENT_ID no definido");
  if (!CLIENT_SECRET) throw new Error("SPOTIFY_CLIENT_SECRET no definido");
  if (!REFRESH_TOKEN) throw new Error("SPOTIFY_DEVELOPER_REFRESH_TOKEN o SPOTIFY_REFRESH_TOKEN no definido");
  }

  if (accessToken && Date.now() < expiresAt) return accessToken;

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error || "No se pudo refrescar token");
    }

    accessToken = data.access_token;
    expiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

async function isDuplicateTrack(trackUri, token) {
  const limit = 100;
  let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri)),next&limit=${limit}`;
  
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) break;
      
      const j = await r.json();
      const items = j.items || [];
      if (items.some(x => x?.track?.uri === trackUri)) return true;
      if (!j.next) break;
      url = j.next;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      break;
    }
  }
  return false;
}

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { trackUri, trackName, artistName } = req.body || {};
    
    if (!trackUri || !trackUri.startsWith("spotify:track:")) {
      return res.status(400).json({ error: "trackUri inválido" });
    }

    // Obtener token dentro del handler async
    const token = await getAccessToken();

    // Chequeo de duplicado
    const isDuplicate = await isDuplicateTrack(trackUri, token);
    if (isDuplicate) {
      return res.status(409).json({
        error: "Canción duplicada",
        message: "Esta canción ya está en la playlist",
      });
    }

    // Agregar canción
    const addRes = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri], position: 0 }),
      }
    );

    if (!addRes.ok) {
      const errorData = await addRes.json();
      
      // Si es error de autenticación, intentar refrescar token
      if (addRes.status === 401) {
        // Forzar refresco del token
        accessToken = null;
        expiresAt = 0;
        const newToken = await getAccessToken();
        
        // Reintentar con nuevo token
        const retryRes = await fetch(
          `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${newToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [trackUri], position: 0 }),
          }
        );
        
        if (!retryRes.ok) {
          const retryError = await retryRes.json();
          return res.status(retryRes.status).json({ error: retryError });
        }
        
        const successData = await retryRes.json();
        return res.status(200).json({
          message: "Canción agregada exitosamente",
          trackName,
          artistName,
          snapshot_id: successData.snapshot_id,
        });
      }
      
      return res.status(addRes.status).json({ error: errorData });
    }

    const successData = await addRes.json();
    return res.status(200).json({
      message: "Canción agregada exitosamente",
      trackName,
      artistName,
      snapshot_id: successData.snapshot_id,
    });

  } catch (error) {
    console.error("Error en /api/add-to-playlist:", error);
    return res.status(500).json({ 
      error: error.message || "Error interno del servidor" 
    });
  }
}

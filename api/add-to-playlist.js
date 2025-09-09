const fetch = require("node-fetch");
const db = require("../firebaseAdmin.js");

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const REFRESH_TOKEN = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "0a4iq5x0WHzzn0ox7ea77u";

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error("Variables de entorno faltantes");
      return res.status(500).json({ error: "Configuración del servidor incompleta" });
    }

    const { trackUri } = req.body;

    if (!trackUri || !trackUri.startsWith('spotify:track:')) {
      return res.status(400).json({ error: "URI de track inválido" });
    }

    // Obtener access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });

    if (!tokenResponse.ok) {
      console.error("Error obteniendo token:", await tokenResponse.text());
      return res.status(500).json({ error: "Error de autenticación" });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No se pudo obtener token de acceso" });
    }

    const accessToken = tokenData.access_token;

    // Verificar si la canción ya está en la playlist
    const checkResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri))`,
      {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (checkResponse.ok) {
      const playlistData = await checkResponse.json();
      const trackExists = playlistData.items?.some(item => item.track?.uri === trackUri);
      
      if (trackExists) {
        return res.status(409).json({ 
          error: "Esta canción ya está en la playlist",
          code: "TRACK_EXISTS"
        });
      }
    }

    // Agregar canción a la playlist
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
          position: 0 // Agregar al principio
        })
      }
    );

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      console.error("Error agregando a playlist:", errorText);
      
      if (addResponse.status === 403) {
        return res.status(403).json({ error: "Sin permisos para modificar la playlist" });
      }
      
      return res.status(500).json({ error: "Error agregando canción a la playlist" });
    }

    const addData = await addResponse.json();

    // Guardar en Firebase
    try {
      await db.collection("added_tracks").add({
        trackUri,
        playlistId: PLAYLIST_ID,
        snapshotId: addData.snapshot_id,
        timestamp: new Date(),
        user_agent: req.headers['user-agent'] || 'unknown'
      });
    } catch (firebaseError) {
      console.error("Error guardando en Firebase:", firebaseError);
      // No fallar la request por esto
    }

    res.status(200).json({ 
      success: true,
      message: "Canción agregada exitosamente",
      snapshot_id: addData.snapshot_id 
    });

  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ 
      error: error.message || "Error interno del servidor",
      timestamp: new Date().toISOString()
    });
  }
};

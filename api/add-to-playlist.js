// api/add-to-playlist.js
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "0a4iq5x0WHzzn0ox7ea77u";

let accessToken = null;
let expiresAt = 0;

async function getAccessToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN || process.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Faltan variables de entorno de Spotify");
  }

  if (accessToken && Date.now() < expiresAt) {
    return accessToken;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
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
  let url = "https://api.spotify.com/v1/playlists/" + PLAYLIST_ID + "/tracks?fields=items(track(uri)),next&limit=" + limit;
  
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { 
        headers: { 
          Authorization: "Bearer " + token 
        } 
      });
      
      if (!r.ok) break;
      
      const j = await r.json();
      const items = j.items || [];
      
      if (items.some(function(x) { 
        return x && x.track && x.track.uri === trackUri; 
      })) {
        return true;
      }
      
      if (!j.next) break;
      url = j.next;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      break;
    }
  }
  return false;
}

module.exports = async function handler(req, res) {
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
    const body = req.body || {};
    const trackUri = body.trackUri;
    const trackName = body.trackName;
    const artistName = body.artistName;
    
    if (!trackUri || !trackUri.startsWith("spotify:track:")) {
      return res.status(400).json({ error: "trackUri inválido" });
    }

    const token = await getAccessToken();

    const dup = await isDuplicateTrack(trackUri, token);
    if (dup) {
      return res.status(409).json({
        error: "Canción duplicada",
        message: "Esta canción ya está en la playlist",
      });
    }

    const addRes = await fetch(
      "https://api.spotify.com/v1/playlists/" + PLAYLIST_ID + "/tracks",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri], position: 0 }),
      }
    );

    if (!addRes.ok) {
      const errorData = await addRes.json();
      
      if (addRes.status === 401) {
        accessToken = null;
        expiresAt = 0;
        const newToken = await getAccessToken();
        
        const retryRes = await fetch(
          "https://api.spotify.com/v1/playlists/" + PLAYLIST_ID + "/tracks",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + newToken,
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
          trackName: trackName,
          artistName: artistName,
          snapshot_id: successData.snapshot_id,
        });
      }
      
      return res.status(addRes.status).json({ error: errorData });
    }

    const successData = await addRes.json();
    return res.status(200).json({
      message: "Canción agregada exitosamente",
      trackName: trackName,
      artistName: artistName,
      snapshot_id: successData.snapshot_id,
    });

  } catch (error) {
    console.error("Error en /api/add-to-playlist:", error);
    return res.status(500).json({ 
      error: error.message || "Error interno del servidor" 
    });
  }
};

// api/add-to-playlist.js
// Agrega canciones con la cuenta dueña de la playlist usando SOLO refresh_token

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "0a4iq5x0WHzzn0ox7ea77u";

let accessToken = null;
let expiresAt = 0; // timestamp en ms

async function getAccessToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN =
    process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN || process.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Faltan variables de entorno de Spotify");
  }

  // Si el token actual sirve, úsalo
  if (accessToken && Date.now() < expiresAt) return accessToken;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
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
  // margen de 60s para evitar expiración en medio de la llamada
  expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

// (Opcional) chequeo de duplicados con paginación hasta 200 temas (rápido y suficiente)
async function isDuplicateTrack(trackUri, token) {
  const limit = 100;
  let url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri)),next&limit=${limit}`;
  for (let i = 0; i < 2; i++) { // 2 páginas = 200 temas
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) break;
    const j = await r.json();
    const items = j.items || [];
    if (items.some(x => x?.track?.uri === trackUri)) return true;
    if (!j.next) break;
    url = j.next;
  }
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { trackUri, trackName, artistName } = req.body || {};
    if (!trackUri || !trackUri.startsWith("spotify:track:")) {
      return res.status(400).json({ error: "trackUri inválido" });
    }

    const token = await getAccessToken();

    // Chequeo de duplicado rápido
    const dup = await isDuplicateTrack(trackUri, token);
    if (dup) {
      return res.status(409).json({
        error: "Canción duplicada",
        message: "Esta canción ya está en la playlist",
      });
    }

    // Agregar al principio
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

    const addData = await addRes.json();
    if (!addRes.ok) {
      // Si falló por 401, intenta 1 refresh y reintento
      if (addRes.status === 401) {
        const newToken = await getAccessToken();
        const retry = await fetch(
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
        const retryData = await retry.json();
        if (!retry.ok) {
          return res.status(retry.status).json({ error: retryData });
        }
        return res.status(200).json({
          message: "Canción agregada exitosamente",
          trackName,
          artistName,
          snapshot_id: retryData.snapshot_id,
        });
      }
      return res.status(addRes.status).json({ error: addData });
    }

    return res.status(200).json({
      message: "Canción agregada exitosamente",
      trackName,
      artistName,
      snapshot_id: addData.snapshot_id,
    });
  } catch (e) {
    console.error("Error en /api/add-to-playlist:", e);
    return res.status(500).json({ error: e.message || "Error interno" });
  }
}

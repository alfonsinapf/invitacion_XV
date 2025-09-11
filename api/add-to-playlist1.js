import { db } from "../../firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const { trackUri } = req.body;
  if (!trackUri) return res.status(400).json({ error: "Falta URI de la canción" });

  try {
    const docSnap = await db.collection("spotifyTokens").doc("spotify_dev").get();
    if (!docSnap.exists) return res.status(401).json({ error: "No hay token de Spotify" });

    const { access_token } = docSnap.data();
    const playlistId = process.env.SPOTIFY_PLAYLIST_ID;

    // Verificar si la canción ya está en la playlist
    const checkRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${encodeURIComponent(trackUri)}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // Agregar a la playlist
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [trackUri] })
    });

    if (!addRes.ok) {
      const err = await addRes.json();
      if (err.error?.status === 400) return res.status(400).json({ alreadyExists: true });
      return res.status(400).json({ error: err.error?.message || "Error agregando canción" });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error agregando canción" });
  }
}

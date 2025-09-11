import { db } from "../../firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const { query } = req.body;

  if (!query) return res.status(400).json({ error: "Falta el término de búsqueda" });

  try {
    const docSnap = await db.collection("spotifyTokens").doc("spotify_dev").get();
    if (!docSnap.exists) return res.status(401).json({ error: "No hay token de Spotify" });

    const { access_token } = docSnap.data();

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en búsqueda" });
  }
}

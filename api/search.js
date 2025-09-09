import fetch from "node-fetch";
import db from "../firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const REFRESH_TOKEN = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: "Variables de entorno faltantes" });
    }

    // Obtener access token de Spotify
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "No se pudo obtener token de Spotify" });
    }

    const accessToken = tokenData.access_token;
    const { query } = req.body;

    if (!query) return res.status(400).json({ error: "No se indicó query" });

    // Buscar canciones
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const searchData = await searchResponse.json();
    const tracks = searchData.tracks?.items || [];

    // Opcional: guardar logs en Firebase
    await db.collection("spotify_searches").add({
      query,
      timestamp: new Date(),
      results_count: tracks.length
    });

    res.status(200).json({ tracks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error interno" });
  }
}

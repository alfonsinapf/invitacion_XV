import fetch from "node-fetch";
import db from "../firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "No se indicó query" });

    const doc = await db.collection("spotifyTokens").doc("owner").get();
    if (!doc.exists) return res.status(500).json({ error: "No hay refresh token en Firestore" });

    const REFRESH_TOKEN = doc.data().refresh_token;
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return res.status(500).json({ error: "No se pudo obtener access token" });

    const accessToken = tokenData.access_token;

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchResponse.json();
    return res.status(200).json({ tracks: searchData.tracks?.items || [] });
  } catch (error) {
    console.error("Error en /api/search:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

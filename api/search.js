// api/search.js
import fetch from "node-fetch";
import db from "./firebaseAdmin.js";

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const REFRESH_TOKEN = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error("Variables de entorno faltantes");
      return res.status(500).json({ 
        error: "Configuración de Spotify incompleta. Contacta al administrador." 
      });
    }

    // Obtener access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      },
      body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Error obteniendo token de Spotify:", errorText);
      return res.status(500).json({ 
        error: "Error de autenticación con Spotify. Intenta nuevamente." 
      });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("No se pudo obtener access token:", tokenData);
      return res.status(500).json({ 
        error: "No se pudo obtener acceso a Spotify. Intenta nuevamente." 
      });
    }

    const accessToken = tokenData.access_token;
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Por favor, ingresa una canción o artista para buscar." });
    }

    // Buscar canciones
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=12`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Error en búsqueda de Spotify:", errorText);
      return res.status(500).json({ 
        error: "Error al buscar en Spotify. Intenta nuevamente." 
      });
    }

    const searchData = await searchResponse.json();
    const tracks = searchData.tracks?.items || [];

    // Guardar búsqueda en Firebase (opcional)
    try {
      await db.collection("spotify_searches").add({
        query: query.trim(),
        timestamp: new Date(),
        results_count: tracks.length,
        user_agent: req.headers["user-agent"] || "unknown",
      });
    } catch (firebaseError) {
      console.error("Error guardando en Firebase (no crítico):", firebaseError);
      // No fallar la request por esto
    }

    res.status(200).json({
      tracks,
      query: query.trim(),
      count: tracks.length,
    });
  } catch (error) {
    console.error("Error general en búsqueda:", error);
    res.status(500).json({
      error: "Error interno del servidor. Por favor, intenta nuevamente.",
    });
  }
}

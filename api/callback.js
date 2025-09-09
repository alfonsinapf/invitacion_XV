import fetch from "node-fetch";
import db from "../firebaseAdmin.js"; // Admin SDK para backend

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Falta el code en la query" });
    }

    // 🔄 Intercambiar code por tokens
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI, // debe coincidir con Spotify Dashboard
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("❌ Error en intercambio:", tokenData);
      return res.status(500).json({ error: tokenData.error_description || "No se pudo obtener token" });
    }

    const { access_token, refresh_token } = tokenData;

    // 📝 Guardar refresh_token en Firestore
    if (refresh_token) {
      await db.collection("spotifyTokens").doc("owner").set({
        refresh_token,
        updated_at: new Date(),
      });
      console.log("✅ Refresh token guardado en Firestore");
    }

    // 🔙 Podés redirigir al frontend o devolver JSON
    return res.status(200).json({
      message: "Tokens obtenidos correctamente",
      access_token,
      refresh_token,
    });
  } catch (error) {
    console.error("❌ Error en /api/callback:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// /api/callback.js
import fetch from "node-fetch";
import db from "../firebase"; // archivo donde inicializás Firebase Admin

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("No se recibió el código de Spotify");
    }

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}`
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.refresh_token) {
      return res.status(400).send("Spotify no devolvió refresh_token");
    }

    // ✅ Guardar en Firestore
    await db.collection("spotifyTokens").doc("owner").set({
      refresh_token: tokenData.refresh_token,
      updatedAt: Date.now()
    });

    res.send("✅ Refresh token guardado en Firestore");
  } catch (error) {
    console.error("❌ Error en callback:", error);
    res.status(500).send("Error en callback");
  }
}

import fetch from "node-fetch";
import db from "../firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Falta el code" });

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
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) return res.status(500).json({ error: tokenData.error_description });

    const { refresh_token } = tokenData;

    if (refresh_token) {
      await db.collection("spotifyTokens").doc("owner").set({
        refresh_token,
        updated_at: new Date(),
      });
    }

    return res.status(200).json({ message: "Refresh token guardado correctamente" });
  } catch (error) {
    console.error("Error en callback:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

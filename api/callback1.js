import { db } from "../../firebaseAdmin.js";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) return res.status(400).send("Falta el código de Spotify");

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://invitacion-xv-alfon.vercel.app/");
    
    const authHeader = "Basic " + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const data = await response.json();

    // Guardar tokens en Firebase
    await db.collection("spotifyTokens").doc(state).set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      updatedAt: new Date()
    });

    res.redirect("/?auth=success"); // Redirige al frontend
  } catch (err) {
    console.error(err);
    res.status(500).send("Error almacenando token");
  }
}

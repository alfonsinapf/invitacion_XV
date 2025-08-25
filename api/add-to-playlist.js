export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { trackUri } = req.body;
    if (!trackUri) {
      return res.status(400).json({ error: "Falta trackUri" });
    }

    // 🔑 Obtener access token con tu CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ error: tokenData });
    }

    const accessToken = tokenData.access_token;

    // 📌 Agregar track a playlist
    const playlistId = process.env.PLAYLIST_ID; // define esto en tu Dashboard de Vercel
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      }
    );

    const result = await addResponse.json();
    if (!addResponse.ok) {
      return res.status(addResponse.status).json({ error: result });
    }

    return res.status(200).json({ message: "Canción añadida con éxito", result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

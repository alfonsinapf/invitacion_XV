export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { trackUri } = req.body;
    if (!trackUri) return res.status(400).json({ error: "Falta trackUri" });

    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.REFRESH_TOKEN })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return res.status(tokenRes.status).json({ error: tokenData });

    const accessToken = tokenData.access_token;

    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [trackUri] })
    });

    const result = await addRes.json();
    if (!addRes.ok) return res.status(addRes.status).json({ error: result });

    return res.status(200).json({ message: "Canción añadida con éxito", result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

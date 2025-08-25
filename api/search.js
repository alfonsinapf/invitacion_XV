export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Falta query" });

  try {
    // Obtener token
    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.REFRESH_TOKEN })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return res.status(tokenRes.status).json({ error: tokenData });

    const accessToken = tokenData.access_token;

    // Buscar canciones
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const searchData = await searchRes.json();
    if (!searchRes.ok) return res.status(searchRes.status).json({ error: searchData });

    const tracks = searchData.tracks.items.map(t => ({
      name: t.name,
      artist: t.artists.map(a => a.name).join(", "),
      uri: t.uri
    }));

    return res.status(200).json({ tracks });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

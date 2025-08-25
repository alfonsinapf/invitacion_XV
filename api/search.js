import fetch from "node-fetch";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Falta el término de búsqueda" });
    }

    const { access_token } = await getAccessToken();

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await searchResponse.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.status(200).json({ tracks: data.tracks.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

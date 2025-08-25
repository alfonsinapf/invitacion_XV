import fetch from "node-fetch";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const PLAYLIST_ID = process.env.PLAYLIST_ID; // la playlist colaborativa

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
    const { trackUri } = req.body;
    if (!trackUri) {
      return res.status(400).json({ error: "Falta el URI de la canción" });
    }

    const { access_token } = await getAccessToken();

    // Verificar si la canción ya está en la playlist
    const checkResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const playlistData = await checkResponse.json();
    const alreadyAdded = playlistData.items.some(
      (item) => item.track.uri === trackUri
    );

    if (alreadyAdded) {
      return res.status(200).json({ message: "La canción ya está en la playlist" });
    }

    // Agregar la canción a la playlist
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      }
    );

    if (!addResponse.ok) {
      const error = await addResponse.json();
      return res.status(400).json({ error });
    }

    res.status(200).json({ message: "Canción añadida con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

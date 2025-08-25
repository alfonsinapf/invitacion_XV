export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { trackUri } = req.body;

  if (!trackUri) {
    return res.status(400).json({ error: "Falta el trackUri" });
  }

  try {
    const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
    const token = process.env.SPOTIFY_ACCESS_TOKEN;

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
🔑 Paso 3: Configurar variables de entorno en Vercel
En tu proyecto de Vercel, andá a Settings → Environment Variables.

Cargá:

SPOTIFY_PLAYLIST_ID → el ID de tu playlist (lo ves en el link de Spotify: https://open.spotify.com/playlist/XXXXXXXXX).

SPOTIFY_ACCESS_TOKEN → el token que ya generaste en Spotify Console.

⚠️ Importante: este token expira en 1 hora. Para que sea automático, más adelante configuramos el refresh token, pero por ahora sirve para probar.

🌐 Paso 4: Deploy en Vercel
Hacé Deploy en Vercel.

Cuando termine, vas a tener una URL del estilo:

arduino
Copiar
Editar
https://spotify-backend.vercel.app/api/addTrack
💻 Paso 5: Conectar desde tu index.html en GitHub
En tu página estática de GitHub Pages, cuando el usuario haga clic en "Agregar canción", mandás la URI al backend.

Ejemplo:

html
Copiar
Editar
<script>
async function addSong() {
  const trackUri = "spotify:track:4uLU6hMCjMI75M1A2tKUQC"; // Ejemplo

  const res = await fetch("https://spotify-backend.vercel.app/api/addTrack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ trackUri }),
  });

  const data = await res.json();
  console.log(data);
  alert("Canción agregada a la playlist!");
}
</script>

<button onclick="addSong()">Agregar canción</button>

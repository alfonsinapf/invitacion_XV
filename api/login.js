export default function handler(req, res) {
  const scopes = [
    "user-read-email",      // leer email (opcional)
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI, // debe coincidir con el de tu app Spotify
  });

  const authUrl = `https://accounts.spotify.com/authorize?${queryParams.toString()}`;

  // 🔀 Redirigir al usuario a Spotify
  res.redirect(authUrl);
}

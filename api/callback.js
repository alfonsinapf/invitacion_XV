export default async function handler(req, res) {
  try {
    // El code viene en la query string, no en el body
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("No se recibió 'code' en la URL.");
    }

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://invitacion-xv-alfon.vercel.app/api/callback");
    params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
    params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json(data);
    }

    // ⚠️ Guardá este refresh_token en tu .env, es el que te sirve de por vida
    console.log("REFRESH TOKEN =>", data.refresh_token);

    res.send("✅ Autorización completada. Revisá logs de Vercel para tu refresh_token.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en el callback.");
  }
}

export default async function handler(req, res) {
  const code = req.query.code;

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "https://invitacion-xv-seven.vercel.app/api/callback");
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const data = await response.json();

  // ⚠️ El refresh_token aparece acá, guardalo en tu .env o BD
  console.log("REFRESH TOKEN =>", data.refresh_token);

  res.send("Autorización completada ✅. Revisá logs de Vercel para ver tu refresh_token.");
}

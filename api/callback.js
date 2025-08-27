export default async function handler(req, res) {
  const { code } = req.body;

  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://invitacion-xv-seven.vercel.app/",
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data });
    }

    return res.status(200).json(data); // contiene access_token y refresh_token
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

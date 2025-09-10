export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "GET") {
    // Manejar el callback de autenticación de Spotify
    const { code, error } = req.query;
    
    if (error) {
      console.error("Error en callback de Spotify:", error);
      return res.status(400).json({ error: "Autenticación fallida" });
    }
    
    if (code) {
      try {
        // Intercambiar código por token de acceso
        const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
        
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "https://invitacion-xv-alfon.vercel.app/",
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error("Error obteniendo token de acceso");
        }

        const tokenData = await tokenResponse.json();
        
        // Aquí podrías guardar el refresh token en tu base de datos
        console.log("Token obtenido exitosamente");
        
        // Redirigir a una página de éxito o mostrar mensaje
        res.writeHead(302, { Location: 'https://invitacion-xv-alfon.vercel.app/?auth=success' });
        res.end();
        
      } catch (error) {
        console.error("Error en callback:", error);
        res.writeHead(302, { Location: 'https://invitacion-xv-alfon.vercel.app/?auth=error' });
        res.end();
      }
    }
  } else {
    res.status(405).json({ error: "Método no permitido" });
  }
}

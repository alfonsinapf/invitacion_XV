// api/auth-server.js - Manejo de autenticación del servidor
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'ba9385bd54cc4ba3b297ce5fca852fd9';
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'a636c32c9c654e92ae32bda3cfd1295e';

  try {
    // Obtener token usando Client Credentials Flow
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify Auth Error:', data);
      return res.status(response.status).json({ 
        error: 'Error de autenticación con Spotify',
        details: data 
      });
    }

    // Devolver solo el token (sin exponer otras credenciales)
    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    });

  } catch (error) {
    console.error('Error en server auth:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}

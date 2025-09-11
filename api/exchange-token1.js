export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const { code, redirect_uri, refresh_token, grant_type } = req.body;

    let body;
    
    if (grant_type === 'refresh_token' && refresh_token) {
      // Refrescar token
      body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      });
    } else if (code && redirect_uri) {
      // Intercambiar código por token
      body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
      });
    } else {
      return res.status(400).json({ 
        error: 'Parámetros inválidos',
        required: 'code + redirect_uri OR refresh_token + grant_type'
      });
    }

    const headers = {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers,
      body
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify API Error:', data);
      return res.status(response.status).json({ 
        error: 'Error de Spotify API', 
        details: data 
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error en exchange-token:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}

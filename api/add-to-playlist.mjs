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

  const PLAYLIST_ID = '0a4iq5x0WHzzn0ox7ea77u';

  try {
    const { trackUri } = req.body;
    const authHeader = req.headers.authorization;

    if (!trackUri) {
      return res.status(400).json({ error: 'Falta el parámetro trackUri' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorización requerido' });
    }

    const accessToken = authHeader.split(' ')[1];

    // Verificar si la canción ya está en la playlist
    const checkResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri))&limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      const existingTracks = checkData.items?.map(item => item.track?.uri) || [];
      
      if (existingTracks.includes(trackUri)) {
        return res.status(409).json({ 
          error: 'La canción ya está en la playlist',
          message: 'Esta canción ya fue agregada anteriormente'
        });
      }
    }

    // Agregar track a playlist
    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [trackUri],
        position: 0 // Agregar al principio de la playlist
      })
    });

    const addData = await addResponse.json();

    if (!addResponse.ok) {
      console.error('Spotify Add Track Error:', addData);
      return res.status(addResponse.status).json({ 
        error: 'Error agregando canción a Spotify',
        details: addData
      });
    }

    return res.status(200).json({ 
      message: 'Canción agregada exitosamente',
      snapshot_id: addData.snapshot_id
    });

  } catch (error) {
    console.error('Error en /api/add-to-playlist:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

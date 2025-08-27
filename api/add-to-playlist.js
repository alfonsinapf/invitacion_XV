// api/add-to-playlist.js - Agregar canciones usando token del desarrollador
const PLAYLIST_ID = '0a4iq5x0WHzzn0ox7ea77u';

// Token del usuario desarrollador (necesitas obtenerlo manualmente una vez)
// Este token debe tener permisos de playlist-modify-public y playlist-modify-private
let developerToken = process.env.SPOTIFY_DEVELOPER_TOKEN;
let developerRefreshToken = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN;
let tokenExpiration = null;

async function refreshDeveloperToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'ba9385bd54cc4ba3b297ce5fca852fd9';
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'a636c32c9c654e92ae32bda3cfd1295e';

  if (!developerRefreshToken) {
    throw new Error('No hay refresh token del desarrollador configurado');
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: developerRefreshToken
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error refrescando token: ${data.error_description || data.error}`);
    }

    // Actualizar token
    developerToken = data.access_token;
    tokenExpiration = Date.now() + ((data.expires_in - 60) * 1000); // 60 segundos de margen

    // Si hay un nuevo refresh token, actualizarlo
    if (data.refresh_token) {
      developerRefreshToken = data.refresh_token;
    }

    console.log('Token del desarrollador refrescado exitosamente');
    return developerToken;
  } catch (error) {
    console.error('Error refrescando token del desarrollador:', error);
    throw error;
  }
}

function isDeveloperTokenValid() {
  return developerToken && tokenExpiration && Date.now() < tokenExpiration;
}

async function ensureDeveloperToken() {
  if (!isDeveloperTokenValid()) {
    if (developerRefreshToken) {
      return await refreshDeveloperToken();
    } else {
      throw new Error('No hay token ni refresh token del desarrollador disponible');
    }
  }
  return developerToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { trackUri, trackName, artistName } = req.body;

    if (!trackUri) {
      return res.status(400).json({ error: 'Se requiere trackUri' });
    }

    // Validar formato del URI
    if (!trackUri.startsWith('spotify:track:')) {
      return res.status(400).json({ error: 'Formato de trackUri inválido' });
    }

    // Asegurar que tenemos un token válido del desarrollador
    const token = await ensureDeveloperToken();

    console.log(`Agregando canción: ${trackName || 'Unknown'} - ${artistName || 'Unknown'}`);

    // Primero verificar si la canción ya está en la playlist
    const checkResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(uri))&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      const existingTracks = checkData.items?.map(item => item.track?.uri) || [];
      
      if (existingTracks.includes(trackUri)) {
        return res.status(409).json({ 
          error: 'Canción duplicada',
          message: 'Esta canción ya está en la playlist'
        });
      }
    }

    // Agregar canción a la playlist
    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [trackUri],
        position: 0 // Agregar al principio de la playlist
      })
    });

    const addData = await addResponse.json();

    if (!addResponse.ok) {
      // Si el token expiró, intentar refrescar y reintentar
      if (addResponse.status === 401 && developerRefreshToken) {
        console.log('Token expirado, refrescando...');
        const newToken = await refreshDeveloperToken();
        
        // Reintentar agregar canción
        const retryResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [trackUri],
            position: 0
          })
        });

        if (!retryResponse.ok) {
          const retryData = await retryResponse.json();
          console.error('Error en reintento de agregar canción:', retryData);
          return res.status(retryResponse.status).json({ 
            error: 'Error agregando canción a Spotify',
            details: retryData
          });
        }

        const retryAddData = await retryResponse.json();
        return res.status(200).json({ 
          message: 'Canción agregada exitosamente',
          trackName: trackName,
          artistName: artistName,
          snapshot_id: retryAddData.snapshot_id
        });
      }

      console.error('Spotify Add Track Error:', addData);
      return res.status(addResponse.status).json({ 
        error: 'Error agregando canción a Spotify',
        details: addData
      });
    }

    console.log('Canción agregada exitosamente a la playlist');

    return res.status(200).json({ 
      message: 'Canción agregada exitosamente',
      trackName: trackName,
      artistName: artistName,
      snapshot_id: addData.snapshot_id
    });

  } catch (error) {
    console.error('Error en /api/add-to-playlist:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: error.stack
    });
  }
}

// SOLUCIÓN PASO A PASO PARA CONFIGURAR LOS TOKENS

// 1. OBTENER EL TOKEN DEL DESARROLLADOR (solo una vez)
// Ejecuta este código en la consola del navegador después de autenticarte:

/*
// Ve a esta URL y autoriza la aplicación:
https://accounts.spotify.com/authorize?client_id=ba9385bd54cc4ba3b297ce5fca852fd9&response_type=code&redirect_uri=https://invitacion-xv-seven.vercel.app/api/callback&scope=playlist-modify-public playlist-modify-private user-read-email

// Después de autorizar, obtendrás un código. Úsalo aquí:
const code = 'AQDV-g6WrHec9NTO0zW0gbCkqJZYuSjAmNa3hDXKNIPrAuINecObZsgXfmQ_Jum7gdbQ7HGDw7X0oYcGjwpwLmIMuXywIXxV4gokpbSbFNlDslVcMqpOH_1_eXBteyVzK4PWWnh4Ktmuv8NafKsomDByNdo6HNNhmOqG_BH0-PeAnULp25aI-WzHaEuvo_0m06UhDCrvvRtZ9D_nki_iuViwQyJH-KWjUEatP51s24Pdm5iIxY9_6MeLOHL87TYJ1ihumtWLZ9n-zO3Ay-lkj-qXbdUcC21Meg'; // El código que obtuviste
const clientId = 'ba9385bd54cc4ba3b297ce5fca852fd9';
const clientSecret = 'a636c32c9c654e92ae32bda3cfd1295e';
const redirectUri = 'https://invitacion-xv-seven.vercel.app/api/callback';

// Intercambiar código por tokens
fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  })
})
.then(response => response.json())
.then(data => {
  console.log('GUARDA ESTOS TOKENS:');
  console.log('SPOTIFY_DEVELOPER_TOKEN =', data.access_token);
  console.log('SPOTIFY_DEVELOPER_REFRESH_TOKEN =', data.refresh_token);
});
*/

// 2. CREAR ARCHIVO DE VARIABLES DE ENTORNO (.env.local)
/* Crea un archivo .env.local en la raíz de tu proyecto con:

SPOTIFY_CLIENT_ID=ba9385bd54cc4ba3b297ce5fca852fd9
SPOTIFY_CLIENT_SECRET=a636c32c9c654e92ae32bda3cfd1295e
SPOTIFY_DEVELOPER_TOKEN=BQCDd37MY6egSMj6ZtsTjoCe_kHr2AcftpyeTF_0T2k4oujs_bC0_CwfJl0J-BrXTGPVdmbwwKYQWo7sG9Ivx_RDU16zFUEW97GENd-qh0DAnb4zTP5ROmmrJixhtJLal1VF6vk1SHJHQFWzsLChdAU3fQr0nZiqO5_y7zLH0VzCW1LRylLTVPkTq2jaaPvtJNti_FlqM1yPZE0eUulKP98UJwG4c9LNu-n-HZ9z2rnB3ARlHChM9EEXMkJi1jI8by_OrePjrTttEKdwzCC7jOEEDRAkRHlF-RkaY_K_dzNKxGAmDg
SPOTIFY_DEVELOPER_REFRESH_TOKEN=AQAo5SK5xD3yHCFo77Z3ZtBIUVkdJibIiZfP1w7hLxAUI4fz3I6tDunqRX48fKurc6sSIonfWA1Dr_xQ0eJTVdC7AUx1_u_gHvWUef7eWuVoBPQzOBdGX8aeFvISnRWkJ6g

*/

// 3. VERSIÓN MEJORADA DE add-to-playlist.js
// Reemplaza el contenido de api/add-to-playlist.js con esto:

const PLAYLIST_ID = '0a4iq5x0WHzzn0ox7ea77u';

// Tokens del desarrollador
let developerToken = process.env.SPOTIFY_DEVELOPER_TOKEN;
let developerRefreshToken = process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN;
let tokenExpiration = null;

async function refreshDeveloperToken() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'ba9385bd54cc4ba3b297ce5fca852fd9';
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'a636c32c9c654e92ae32bda3cfd1295e';

  if (!developerRefreshToken) {
    throw new Error('Token de autorización requerido');
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

    developerToken = data.access_token;
    tokenExpiration = Date.now() + ((data.expires_in - 60) * 1000);

    if (data.refresh_token) {
      developerRefreshToken = data.refresh_token;
    }

    return developerToken;
  } catch (error) {
    console.error('Error refrescando token:', error);
    throw error;
  }
}

async function ensureDeveloperToken() {
  if (!developerToken) {
    throw new Error('Token de autorización requerido');
  }

  if (!tokenExpiration || Date.now() >= tokenExpiration) {
    return await refreshDeveloperToken();
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

    if (!trackUri.startsWith('spotify:track:')) {
      return res.status(400).json({ error: 'Formato de trackUri inválido' });
    }

    // Verificar que tenemos los tokens necesarios
    if (!developerToken || !developerRefreshToken) {
      return res.status(401).json({ 
        error: 'Token de autorización requerido',
        message: 'El administrador debe configurar los tokens de Spotify'
      });
    }

    const token = await ensureDeveloperToken();

    // Verificar duplicados
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

    // Agregar canción
    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [trackUri],
        position: 0
      })
    });

    const addData = await addResponse.json();

    if (!addResponse.ok) {
      if (addResponse.status === 401) {
        const newToken = await refreshDeveloperToken();
        
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
          return res.status(retryResponse.status).json({ 
            error: 'Error agregando canción',
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

      return res.status(addResponse.status).json({ 
        error: 'Error agregando canción',
        details: addData
      });
    }

    return res.status(200).json({ 
      message: 'Canción agregada exitosamente',
      trackName: trackName,
      artistName: artistName,
      snapshot_id: addData.snapshot_id
    });

  } catch (error) {
    console.error('Error en add-to-playlist:', error);
    
    if (error.message === 'Token de autorización requerido') {
      return res.status(401).json({ 
        error: 'Token de autorización requerido',
        message: 'Contacta al administrador para configurar la integración con Spotify'
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// 4. CONFIGURACIÓN EN VERCEL (Variables de Entorno)
/*
Si estás usando Vercel:
1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a Settings > Environment Variables
4. Agrega estas variables:

SPOTIFY_CLIENT_ID = ba9385bd54cc4ba3b297ce5fca852fd9
SPOTIFY_CLIENT_SECRET = a636c32c9c654e92ae32bda3cfd1295e  
SPOTIFY_DEVELOPER_TOKEN = (el token que obtuviste)
SPOTIFY_DEVELOPER_REFRESH_TOKEN = (el refresh token que obtuviste)

5. Redeploy tu aplicación
*/

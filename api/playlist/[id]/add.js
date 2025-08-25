export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { playlistId } = req.query;
    const { trackId } = req.body;

    if (!playlistId) {
        return res.status(400).json({ error: 'Playlist ID es requerido' });
    }

    if (!trackId) {
        return res.status(400).json({ error: 'Track ID es requerido' });
    }

    try {
        const token = await getSpotifyToken();
        
        // Construir URI de Spotify
        const trackUri = `spotify:track:${trackId}`;
        
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [trackUri],
                    position: 0 // Añadir al principio de la playlist
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        
        res.status(200).json({ 
            success: true, 
            snapshot_id: data.snapshot_id,
            message: 'Canción añadida exitosamente' 
        });

    } catch (error) {
        console.error('Error in add to playlist endpoint:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

// Función auxiliar para obtener el token de Spotify
async function getSpotifyToken() {
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error('Faltan credenciales de Spotify en las variables de entorno');
    }

    try {
        // Usar refresh token para obtener un access token válido
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': REFRESH_TOKEN
            })
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;

    } catch (error) {
        console.error('Error getting Spotify token:', error);
        throw new Error('Failed to authenticate with Spotify');
    }
}

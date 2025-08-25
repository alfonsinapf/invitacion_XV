export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { playlistId } = req.query;

    if (!playlistId) {
        return res.status(400).json({ error: 'Playlist ID es requerido' });
    }

    try {
        const token = await getSpotifyToken();
        
        // Obtener todas las canciones de la playlist (con paginación)
        let allTracks = [];
        let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(id,name,duration_ms,artists(name))),next&limit=50`;
        
        while (nextUrl) {
            const response = await fetch(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            const data = await response.json();
            allTracks = allTracks.concat(data.items);
            nextUrl = data.next;
        }

        // Formatear las canciones
        const tracks = allTracks
            .filter(item => item.track && item.track.id) // Filtrar tracks válidos
            .map(item => ({
                id: item.track.id,
                name: item.track.name,
                artists: item.track.artists.map(artist => artist.name),
                duration_ms: item.track.duration_ms
            }));

        res.status(200).json({ tracks });

    } catch (error) {
        console.error('Error in playlist tracks endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

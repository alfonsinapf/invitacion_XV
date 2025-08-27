import fetch from 'node-fetch';

const CLIENT_ID = 'ba9385bd54cc4ba3b297ce5fca852fd9';
const CLIENT_SECRET = 'a636c32c9c654e92ae32bda3cfd1295e';
const REDIRECT_URI = 'https://invitacion-xv-seven.vercel.app/';
const PLAYLIST_ID = '0a4iq5x0WHzzn0ox7ea77u';

export default async function handler(req, res) {
    try {
        const { code, track_id } = req.body;
        if (!code || !track_id) return res.status(400).json({ error: 'Faltan parámetros' });

        // Obtener access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) return res.status(401).json({ error: 'Error autenticación', details: tokenData });

        // Agregar track a playlist
        const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?uris=spotify:track:${track_id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        if (addResponse.status === 201 || addResponse.status === 200) {
            res.status(200).json({ message: 'Canción agregada!' });
        } else {
            const errorData = await addResponse.json();
            res.status(400).json({ error: 'Error agregando canción', details: errorData });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

import fetch from 'node-fetch';

const CLIENT_ID = 'ba9385bd54cc4ba3b297ce5fca852fd9';
const CLIENT_SECRET = 'TU_CLIENT_SECRET'; // ⚠️ mantener en secreto
const REDIRECT_URI = 'https://invitacion-xv-seven.vercel.app/';

export default async function handler(req, res) {
    try {
        const { code, query } = req.body;

        if (!code || !query) {
            return res.status(400).json({ error: 'Faltan parámetros: code o query' });
        }

        // 1️⃣ Intercambiar el authorization code por access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            return res.status(401).json({ error: 'Error de autenticación con Spotify', details: tokenData });
        }

        const accessToken = tokenData.access_token;

        // 2️⃣ Buscar canciones usando la API de Spotify
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const searchData = await searchResponse.json();

        return res.status(200).json(searchData);
    } catch (error) {
        console.error('Error en /api/search:', error);
        return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
}

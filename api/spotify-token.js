const fetch = require('node-fetch');

async function getAccessToken() {
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Variables de entorno de Spotify faltantes');
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error('No se pudo obtener access token de Spotify');
  }

  return tokenData.access_token;
}

module.exports = { getAccessToken };

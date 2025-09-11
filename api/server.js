// server.js - VERSION MEJORADA
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const fs = require('fs');
const cors = require('cors'); // <- Agregar este paquete

const app = express();

// Middlewares
app.use(cors()); // <- Habilitar CORS para todas las rutas
app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos

const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

// ---------- Storage simple ----------
const TOKEN_FILE = './spotify_owner_token.json';

function saveOwnerToken(obj) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(obj, null, 2));
}

function loadOwnerToken() {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE));
  } catch (error) {
    return null;
  }
}

// ---------- Helpers ----------
async function refreshAccessToken(refresh_token) {
  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Error refresh token: ' + txt);
  }
  return res.json();
}

async function getOwnerAccessToken() {
  const owner = loadOwnerToken();
  if (!owner || !owner.refresh_token) throw new Error('Owner not authenticated. Please authenticate first at /auth/login');

  const data = await refreshAccessToken(owner.refresh_token);
  const access_token = data.access_token;
  
  if (data.refresh_token) {
    owner.refresh_token = data.refresh_token;
    saveOwnerToken(owner);
  }
  return access_token;
}

// ---------- OAuth endpoints ----------
app.get('/auth/login', (req, res) => {
  const scope = [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-modify-playback-state',
    'user-read-playback-state',
    'streaming' // <- Importante para Web Playback SDK
  ].join(' ');

  const params = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    show_dialog: true
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    const body = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return res.status(500).send('Error obteniendo token: ' + errorText);
    }

    const tokenData = await tokenRes.json();
    const ownerData = {
      obtained_at: Date.now(),
      refresh_token: tokenData.refresh_token,
      scopes: tokenData.scope,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    };
    
    saveOwnerToken(ownerData);
    res.send('✅ Autenticación completada. Ya puedes cerrar esta ventana y usar tu reproductor.');

  } catch (error) {
    console.error('Error en callback:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ---------- API: Search (CORREGIDO) ----------
app.get('/api/search', async (req, res) => { // Cambiado a GET
  try {
    const query = req.query.q; // Cambiado a req.query para GET
    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const token = await getOwnerAccessToken();
    const params = querystring.stringify({ 
      q: query, 
      type: 'track', 
      limit: 12,
      market: 'AR' // Agregar market
    });
    
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      return res.status(searchResponse.status).json({ 
        error: 'Spotify API error', 
        details: errorData 
      });
    }

    const data = await searchResponse.json();
    const tracks = data.tracks?.items || [];
    
    res.json({ 
      tracks,
      total: data.tracks?.total || 0
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ... (mantén el resto de tus endpoints como están)

// Ruta de verificación de estado
app.get('/api/status', async (req, res) => {
  try {
    const owner = loadOwnerToken();
    const isAuthenticated = !!(owner && owner.refresh_token);
    
    res.json({ 
      authenticated: isAuthenticated,
      message: isAuthenticated ? '✅ Conectado a Spotify' : '❌ No autenticado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Servidor de Spotify ejecutándose en http://localhost:${PORT}`);
  console.log(`🔑 Autentica primero en: http://localhost:${PORT}/auth/login`);
});

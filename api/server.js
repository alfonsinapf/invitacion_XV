// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // o undici
const bodyParser = require('body-parser');
const querystring = require('querystring');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI; // e.g. https://tudomain.com/auth/callback
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID; // la playlist a controlar

// ---------- Storage simple (ejemplo) ----------
const TOKEN_FILE = './spotify_owner_token.json';

function saveOwnerToken(obj) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(obj, null, 2));
}

function loadOwnerToken() {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_FILE));
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
  return res.json(); // contains access_token (+ maybe new refresh_token)
}

// Middleware to get a valid access token for owner
async function getOwnerAccessToken() {
  const owner = loadOwnerToken();
  if (!owner || !owner.refresh_token) throw new Error('Owner not authenticated');

  const data = await refreshAccessToken(owner.refresh_token);
  const access_token = data.access_token;
  // If Spotify returns a new refresh_token (rare), store it
  if (data.refresh_token) {
    owner.refresh_token = data.refresh_token;
    saveOwnerToken(owner);
  }
  return access_token;
}

// ---------- OAuth endpoints for owner (one-time) ----------
app.get('/auth/login', (req, res) => {
  const scope = [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-modify-playback-state',
    'user-read-playback-state'
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
  if (!code) return res.status(400).send('No code');

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
    const t = await tokenRes.text();
    return res.status(500).send('Token error: ' + t);
  }

  const tokenData = await tokenRes.json();
  // tokenData: access_token, token_type, scope, expires_in, refresh_token
  // Guardamos refresh_token del owner (persistir en DB en producción)
  const ownerData = {
    obtained_at: Date.now(),
    refresh_token: tokenData.refresh_token,
    scopes: tokenData.scope
  };
  saveOwnerToken(ownerData);

  res.send('Autenticación completada. Ya podés cerrar esta ventana.'); // o redirect a admin page
});

// ---------- API: Search ----------
app.post('/api/search', async (req, res) => {
  try {
    const query = req.body.query;
    if (!query) return res.status(400).json({ error: 'query required' });

    const token = await getOwnerAccessToken();
    const params = querystring.stringify({ q: query, type: 'track', limit: 12 });
    const r = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    // Normalizar: devolver tracks array
    const tracks = (data.tracks && data.tracks.items) ? data.tracks.items : [];
    res.json({ tracks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- API: Add to playlist ----------
app.post('/api/add-to-playlist', async (req, res) => {
  try {
    const { trackUri } = req.body;
    if (!trackUri) return res.status(400).json({ error: 'trackUri required' });

    const token = await getOwnerAccessToken();
    // Add tracks
    const r = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [trackUri] })
    });

    if (r.status === 201 || r.status === 200) {
      return res.json({ ok: true });
    } else if (r.status === 409) {
      const txt = await r.text();
      return res.status(409).json({ error: 'Conflict', text: txt });
    } else {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- API: Get playlist items ----------
app.get('/api/playlist', async (req, res) => {
  try {
    const token = await getOwnerAccessToken();
    const r = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }
    const data = await r.json();
    // send items => map to minimal fields for frontend
    const items = data.items.map(i => ({
      added_at: i.added_at,
      added_by: i.added_by?.id,
      track: {
        id: i.track.id,
        name: i.track.name,
        uri: i.track.uri,
        artists: i.track.artists.map(a => a.name),
        album: { images: i.track.album.images }
      }
    }));
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- API: Player token (access token para inicializar Web Playback SDK) ----------
app.get('/api/player-token', async (req, res) => {
  try {
    // Devolvemos un access_token temporal que el frontend usará para inicializar Web Playback SDK.
    // IMPORTANTE: accesos a playback implican que el owner (cuenta que autorizó) sea la que controla playback.
    const token = await getOwnerAccessToken();
    // token viene con expires_in en refreshAccessToken response normally (we're returning it directly)
    res.json({ access_token: token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server listening ${PORT}`));

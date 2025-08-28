/ setup-developer-token.js - Script para obtener el token del desarrollador
// Ejecutar este script UNA VEZ para obtener los tokens necesarios

const CLIENT_ID = 'ba9385bd54cc4ba3b297ce5fca852fd9';
const CLIENT_SECRET = 'a636c32c9c654e92ae32bda3cfd1295e';
const REDIRECT_URI = 'https://invitacion-xv-alfon.vercel.app/'; // URL temporal para obtener el código

console.log(`
🎵 CONFIGURACIÓN DEL TOKEN DE DESARROLLADOR
==========================================

Para que los invitados puedan agregar canciones sin autenticarse, necesitas configurar
el token de tu cuenta de desarrollador (dueño de la playlist) UNA VEZ.

PASOS A SEGUIR:

1. Ve a esta URL en tu navegador (debes estar logueado en la cuenta que es dueña de la playlist):
   
   https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=playlist-modify-public%20playlist-modify-private&state=developer_setup

2. Autoriza la aplicación

3. Serás redirigido a: http://localhost:3000/callback?code=XXXXXX...
   
4. Copia el código (después de "code=") y pégalo en la función de abajo

5. Ejecuta este script para obtener tus tokens
`);

// Función para intercambiar el código por tokens
async function exchangeCodeForTokens(authCode) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data);
      return;
    }

    console.log(`
✅ ¡TOKENS OBTENIDOS EXITOSAMENTE!
================================

Agrega estas variables de entorno en tu Vercel Dashboard:

SPOTIFY_DEVELOPER_TOKEN=${data.access_token}
SPOTIFY_DEVELOPER_REFRESH_TOKEN=${data.refresh_token}

O agrégalas a tu archivo .env local:

SPOTIFY_DEVELOPER_TOKEN="${data.access_token}"
SPOTIFY_DEVELOPER_REFRESH_TOKEN="${data.refresh_token}"

⚠️  IMPORTANTE: 
- Mantén estos tokens en secreto
- El refresh_token no expira, pero el access_token sí
- El sistema los renovará automáticamente

Token expira en: ${data.expires_in} segundos (${Math.round(data.expires_in/3600)} horas)
    `);

  } catch (error) {
    console.error('❌ Error obteniendo tokens:', error);
  }
}

// PEGA TU CÓDIGO DE AUTORIZACIÓN AQUÍ:
const AUTH_CODE = 'PEGA_TU_CODIGO_AQUI'; // ⚠️ Reemplaza esto con el código que obtuviste

if (AUTH_CODE === 'PEGA_TU_CODIGO_AQUI') {
  console.log('❌ Por favor, pega tu código de autorización en la variable AUTH_CODE');
} else {
  exchangeCodeForTokens(AUTH_CODE);
}

// Para ejecutar este script:
// node setup-developer-token.js

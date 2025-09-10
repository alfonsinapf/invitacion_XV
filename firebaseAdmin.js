import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // Verificar variables de entorno críticas
    const requiredVars = [
      'FIREBASE_TYPE',
      'FIREBASE_PROJECT_ID', 
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
      'FIREBASE_AUTH_URI',
      'FIREBASE_TOKEN_URI',
      'FIREBASE_AUTH_PROVIDER_CERT_URL',
      'FIREBASE_CLIENT_CERT_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Variables de Firebase faltantes:', missingVars);
      throw new Error(`Faltan variables de entorno: ${missingVars.join(', ')}`);
    }

    // Procesar la private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Si viene con comillas adicionales, removerlas y parsear
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = JSON.parse(privateKey);
    }
    
    // Reemplazar \\n con saltos de línea reales
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      })
    });

    console.log('✅ Firebase Admin inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    throw error;
  }
}

const db = admin.firestore();
export { admin, db };

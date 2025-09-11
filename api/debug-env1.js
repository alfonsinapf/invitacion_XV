// api/debug-env.js
module.exports = async (req, res) => {
  res.json({
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? '✅' : '❌',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? '✅' : '❌',
    SPOTIFY_DEVELOPER_REFRESH_TOKEN: process.env.SPOTIFY_DEVELOPER_REFRESH_TOKEN ? '✅' : '❌'
  });
};

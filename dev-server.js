// Local-only dev server. In production these files in api/ run as Vercel
// serverless functions; this little Express wrapper serves the exact same
// handlers on localhost so `npm run dev` (Vite) has a working /api to proxy to.
//
// Not part of the deployed build — Vercel ignores this file.
require('dotenv').config(); // loads .env (your local key)
const express = require('express');

const app = express();

// Each handler is a Vercel-style (req, res) function using req.query and
// res.status().json() / res.setHeader() — all provided by Express, so they
// run here unmodified.
app.all('/api/news', require('./api/news.js'));
app.all('/api/topic', require('./api/topic.js'));
app.all('/api/predictions', require('./api/predictions.js'));
app.all('/api/crypto', require('./api/crypto.js'));
app.all('/api/crypto-search', require('./api/crypto-search.js'));
app.all('/api/onthisday', require('./api/onthisday.js'));
app.all('/api/quotes', require('./api/quotes.js'));
app.all('/api/search', require('./api/search.js'));

const PORT = process.env.DEV_API_PORT || 3000;
app.listen(PORT, () => {
  const finnhub = process.env.FINNHUB_API_KEY ? 'set (live quotes)' : 'missing (demo quotes)';
  console.log(`[dev-api] listening on http://localhost:${PORT}  ·  FINNHUB_API_KEY ${finnhub}`);
});

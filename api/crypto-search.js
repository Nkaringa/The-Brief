const https = require('https');

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

// Coin autocomplete for the "Manage Crypto" panel, via CoinGecko search.
module.exports = async function handler(req, res) {
    const q = (req.query.q || '').trim();
    if (!q || q.length > 50) {
        return res.status(400).json({ error: 'Invalid query' });
    }

    const data = await fetchJson(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`);
    const coins = (data && Array.isArray(data.coins)) ? data.coins : [];

    const results = coins
        .filter(c => c.id && c.symbol)
        .slice(0, 6)
        .map(c => ({ id: c.id, symbol: (c.symbol || '').toUpperCase(), name: c.name }));

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ results });
};

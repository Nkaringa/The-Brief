const https = require('https');

function fetchSymbolSearch(query, token) {
    return new Promise((resolve) => {
        const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(token)}`;
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

module.exports = async function handler(req, res) {
    const q = (req.query.q || '').trim();
    if (!q || q.length > 50) {
        return res.status(400).json({ error: 'Invalid query' });
    }

    const token = process.env.FINNHUB_API_KEY;

    // No API key: return empty results in demo/dev mode
    if (!token) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ results: [] });
    }

    const data = await fetchSymbolSearch(q, token);
    const raw = (data && Array.isArray(data.result)) ? data.result : [];

    const results = raw
        .filter(r => r.symbol && r.description)
        .slice(0, 5)
        .map(r => ({ symbol: r.symbol, name: r.description }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ results });
};

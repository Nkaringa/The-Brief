const https = require('https');

// CoinGecko coin IDs (not tickers). Both sources are free, no key.
const DEFAULT_IDS = ['bitcoin', 'ethereum', 'solana'];

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

// CoinGecko IDs are lowercase slugs, e.g. "bitcoin", "avalanche-2".
function isValidId(s) {
    return /^[a-z0-9][a-z0-9-]{0,39}$/.test(s);
}

module.exports = async function handler(req, res) {
    const param = (req.query.ids || '').toLowerCase();
    let ids = [...new Set(param.split(',').map(s => s.trim()).filter(Boolean).filter(isValidId))].slice(0, 25);
    if (ids.length === 0) ids = DEFAULT_IDS;

    const [marketsData, fng] = await Promise.all([
        fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&price_change_percentage=24h`),
        fetchJson('https://api.alternative.me/fng/?limit=1'),
    ]);

    const order = new Map(ids.map((id, i) => [id, i]));
    const coins = (Array.isArray(marketsData) ? marketsData : [])
        .map(m => ({
            id: m.id,
            symbol: (m.symbol || '').toUpperCase(),
            name: m.name,
            price: m.current_price,
            change_pct: m.price_change_percentage_24h ?? 0,
        }))
        .filter(c => typeof c.price === 'number')
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)); // keep requested order

    let fearGreed = null;
    if (fng && Array.isArray(fng.data) && fng.data[0]) {
        fearGreed = { value: Number(fng.data[0].value), label: fng.data[0].value_classification };
    }

    if (coins.length === 0 && !fearGreed) {
        return res.status(502).json({ error: 'No crypto data available' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    res.status(200).json({ coins, fearGreed });
};

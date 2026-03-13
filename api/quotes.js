const https = require('https');

// All symbols the API will quote — browser cannot request others
const SYMBOLS = {
    SPY:   'S&P 500',
    QQQ:   'Nasdaq 100',
    DIA:   'Dow Jones',
    IWM:   'Russell 2000',
    GLD:   'Gold',
    AAPL:  'Apple',
    MSFT:  'Microsoft',
    NVDA:  'NVIDIA',
    TSLA:  'Tesla',
    AMZN:  'Amazon',
    META:  'Meta',
    GOOGL: 'Alphabet',
    JPM:   'JPMorgan',
    V:     'Visa',
    AMD:   'AMD',
    COIN:  'Coinbase',
};

// Placeholder prices shown when FINNHUB_API_KEY is not set (demo/dev mode)
const DEMO_PRICES = {
    SPY:   { price: 512.34, change:  1.23, change_pct:  0.24 },
    QQQ:   { price: 438.76, change: -2.54, change_pct: -0.58 },
    DIA:   { price: 398.12, change:  0.89, change_pct:  0.22 },
    IWM:   { price: 198.45, change: -0.67, change_pct: -0.34 },
    GLD:   { price: 187.23, change:  0.45, change_pct:  0.24 },
    AAPL:  { price: 171.48, change: -1.23, change_pct: -0.71 },
    MSFT:  { price: 378.92, change:  3.21, change_pct:  0.85 },
    NVDA:  { price: 847.35, change: 12.45, change_pct:  1.49 },
    TSLA:  { price: 173.80, change: -4.56, change_pct: -2.55 },
    AMZN:  { price: 178.23, change:  2.34, change_pct:  1.33 },
    META:  { price: 498.67, change:  5.67, change_pct:  1.15 },
    GOOGL: { price: 157.89, change: -0.34, change_pct: -0.22 },
    JPM:   { price: 196.34, change:  1.12, change_pct:  0.57 },
    V:     { price: 274.56, change: -0.89, change_pct: -0.32 },
    AMD:   { price: 162.45, change:  3.45, change_pct:  2.17 },
    COIN:  { price: 189.23, change: -8.90, change_pct: -4.49 },
};

function fetchQuote(symbol, token) {
    return new Promise((resolve) => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
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
    const token = process.env.FINNHUB_API_KEY;

    const param = (req.query.symbols || '').toUpperCase();
    const requested = param.split(',').map(s => s.trim()).filter(Boolean);
    const allowed = Object.keys(SYMBOLS);
    const symbols = [...new Set(requested.filter(s => allowed.includes(s)))].slice(0, 20);

    if (symbols.length === 0) {
        return res.status(400).json({ error: 'No valid symbols requested' });
    }

    // No API key: return static demo prices so the ticker renders in local/dev
    if (!token) {
        const demo = symbols.map(sym => ({
            symbol: sym,
            name: SYMBOLS[sym],
            ...DEMO_PRICES[sym],
            demo: true,
        }));
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ symbols: demo, demo: true });
    }

    const results = await Promise.all(
        symbols.map(async (sym) => {
            const data = await fetchQuote(sym, token);
            if (!data || !data.c || data.c === 0) return null;
            return {
                symbol: sym,
                name: SYMBOLS[sym],
                price: data.c,
                change: data.d,
                change_pct: data.dp,
            };
        })
    );

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    res.status(200).json({ symbols: results.filter(Boolean) });
};

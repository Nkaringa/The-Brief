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
    if (!token) {
        return res.status(503).json({ error: 'Market data not configured' });
    }

    const param = (req.query.symbols || '').toUpperCase();
    const requested = param.split(',').map(s => s.trim()).filter(Boolean);
    const allowed = Object.keys(SYMBOLS);
    const symbols = [...new Set(requested.filter(s => allowed.includes(s)))].slice(0, 20);

    if (symbols.length === 0) {
        return res.status(400).json({ error: 'No valid symbols requested' });
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

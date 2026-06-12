const https = require('https');

// Polymarket Gamma API — public, no auth.
const GAMMA_TOP = 'https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&ascending=false&limit=40';
const gammaSearch = (q) => `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(q)}&limit_per_type=20`;

// Sports/esports micro-betting markets that read as noise in a news brief.
const NOISE_RE = /counter-strike|cs2|cs:go|valorant|league of legends|\bdota\b|\bbo[135]\b|\bmap\b|handicap|total rounds|over\/under|o\/u|rounds:|maps:/i;

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
        }).on('error', () => resolve(null));
    });
}

function parseArr(str) {
    try { const a = JSON.parse(str || '[]'); return Array.isArray(a) ? a : []; }
    catch { return []; }
}

// Favourite = the sub-market with the highest YES price; carry its 24h move.
function leadingOutcome(event) {
    const markets = (event.markets || []).filter(m => m.active && !m.closed);
    let best = null;
    for (const m of markets) {
        const yes = parseFloat(parseArr(m.outcomePrices)[0]);
        if (Number.isNaN(yes)) continue;
        const binary = markets.length === 1;
        const label = binary ? null : (m.groupItemTitle || m.question || '');
        if (best === null || yes > best.prob) {
            const chg = (m.oneDayPriceChange != null && !Number.isNaN(+m.oneDayPriceChange)) ? +m.oneDayPriceChange : null;
            best = { prob: yes, label, change: chg };
        }
    }
    return best;
}

function shapeEvent(event) {
    if (!event.title || NOISE_RE.test(event.title)) return null;
    const best = leadingOutcome(event);
    if (!best) return null;
    if (best.label && NOISE_RE.test(best.label)) return null;
    return {
        title: event.title,
        outcome: best.label,                                       // null = binary
        probability: Math.round(best.prob * 100),
        change24h: best.change != null ? Math.round(best.change * 100) : null, // percentage points
        volume: Math.round(Number(event.volume) || 0),
        endDate: event.endDate || null,
        url: event.slug ? `https://polymarket.com/event/${event.slug}` : 'https://polymarket.com',
        icon: event.icon || event.image || null,
    };
}

module.exports = async function handler(req, res) {
    const q = (req.query.q || '').trim();
    if (q.length > 100) return res.status(400).json({ error: 'Invalid query' });

    let events = [];
    if (q) {
        const data = await fetchJson(gammaSearch(q));
        events = (data && Array.isArray(data.events)) ? data.events : [];
        events = events.filter(e => e.active && !e.closed);
    } else {
        const data = await fetchJson(GAMMA_TOP);
        events = Array.isArray(data) ? data : [];
    }

    const markets = events
        .map(shapeEvent)
        .filter(Boolean)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, q ? 6 : 12);

    // For a topic search, an empty result is a valid "no related markets".
    if (!q && markets.length === 0) {
        return res.status(502).json({ error: 'No market data available' });
    }

    res.setHeader('Cache-Control', q
        ? 'public, s-maxage=300, stale-while-revalidate=120'
        : 'public, s-maxage=120, stale-while-revalidate=60');
    res.status(200).json({ query: q || null, markets });
};

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
        }).on('error', () => resolve(''));
    });
}

// A notable historical event for today's date, via the free Muffin Labs API.
module.exports = async function handler(req, res) {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const data = await fetchJson(`https://history.muffinlabs.com/date/${month}/${day}`);
    const events = (data && data.data && Array.isArray(data.data.Events)) ? data.data.Events : [];

    if (events.length === 0) {
        return res.status(502).json({ error: 'No history available' });
    }

    // Deterministic pick so the fact stays stable for the whole day.
    const event = events[(month * 31 + day) % events.length];

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).json({ month, day, year: event.year, text: event.text });
};

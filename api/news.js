const { fetchFeed, parseItems, googleNewsUrl } = require('./_rss');

// Curated front-page sections → their Google News search query.
const FEEDS = {
    tech:   'technology',
    stocks: 'stock market',
    war:    'war',
    crypto: 'crypto-currency',
    cyber:  'cybersecurity',
};

module.exports = async function handler(req, res) {
    const entries = Object.entries(FEEDS);
    const xmlBodies = await Promise.all(entries.map(([, query]) => fetchFeed(googleNewsUrl(query))));

    const news = {};
    entries.forEach(([category], i) => {
        news[category] = parseItems(xmlBodies[i]);
    });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ date: new Date().toISOString(), news });
};

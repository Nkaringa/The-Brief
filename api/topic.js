const { fetchFeed, parseItems, googleNewsUrl } = require('./_rss');

// On-demand news for an arbitrary topic. The query is user-supplied, so it is
// length-capped and URL-encoded (in googleNewsUrl) before hitting Google News.
module.exports = async function handler(req, res) {
    const q = (req.query.q || '').trim();

    if (!q || q.length > 100) {
        return res.status(400).json({ error: 'Invalid query' });
    }

    const xml = await fetchFeed(googleNewsUrl(q));
    const articles = parseItems(xml, 20);

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ query: q, date: new Date().toISOString(), articles });
};

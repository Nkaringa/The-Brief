const https = require('https');

const FEEDS = {
    tech:   'https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en',
    stocks: 'https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en',
    war:    'https://news.google.com/rss/search?q=war&hl=en-US&gl=US&ceid=US:en',
    crypto: 'https://news.google.com/rss/search?q=crypto-currency&hl=en-US&gl=US&ceid=US:en',
    cyber:  'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=US&ceid=US:en',
};

function fetchFeed(url, redirects = 0) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }, (res) => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirects < 3) {
                res.resume();
                return resolve(fetchFeed(res.headers.location, redirects + 1));
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', () => resolve(''));
    });
}

// matches both <title><![CDATA[...]]></title> and plain <title>...</title>
const TITLE_RE = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g;
// matches <link>https://...</link> or <guid ...>https://...</guid>
const LINK_RE  = /<(?:link|guid[^>]*)>(https?:\/\/[^<]+)<\/(?:link|guid)>/g;

function decodeEntities(str) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseItems(xml) {
    const titles = [];
    const links  = [];
    let m;

    TITLE_RE.lastIndex = 0;
    while ((m = TITLE_RE.exec(xml)) !== null) titles.push(decodeEntities(m[1].trim()));

    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(xml)) !== null) links.push(m[1]);

    // index 0 is the channel-level title/link — skip it
    const articleTitles = titles.slice(1);
    const articleLinks  = links.slice(1);

    const count = Math.min(articleTitles.length, articleLinks.length, 10);
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push({ title: articleTitles[i], link: articleLinks[i] });
    }
    return items;
}

module.exports = async function handler(req, res) {
    const entries = Object.entries(FEEDS);
    const xmlBodies = await Promise.all(entries.map(([, url]) => fetchFeed(url)));

    const news = {};
    entries.forEach(([category], i) => {
        news[category] = parseItems(xmlBodies[i]);
    });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ date: new Date().toISOString(), news });
};

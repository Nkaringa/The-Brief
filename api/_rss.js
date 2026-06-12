// Shared Google News RSS helpers used by api/news.js and api/topic.js.
// Files prefixed with _ are not exposed as routes by Vercel.
const https = require('https');

// Follow up to 3 redirects; Google News RSS sometimes 301/302s.
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

function decodeEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

// Each <item> block in the feed.
const ITEM_RE  = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
// Within an item: <title><![CDATA[...]]></title> or plain <title>...</title>.
const TITLE_RE = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/;
// The article URL: prefer <link>, fall back to <guid>.
const LINK_RE  = /<link>(https?:\/\/[^<]+)<\/link>/;
const GUID_RE  = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/;

// Parse only the contents of <item> elements, so channel-level <title>/<image>
// (e.g. the "Google News" logo block) can never leak in as a fake headline.
function parseItems(xml, limit = 10) {
    const items = [];
    let m;
    ITEM_RE.lastIndex = 0;
    while ((m = ITEM_RE.exec(xml)) !== null && items.length < limit) {
        const block = m[1];
        const title = TITLE_RE.exec(block);
        const link  = LINK_RE.exec(block) || GUID_RE.exec(block);
        if (title && link) {
            const text = decodeEntities(title[1].trim());
            if (text) items.push({ title: text, link: link[1] });
        }
    }
    return items;
}

// Build a Google News RSS search URL for an arbitrary query.
function googleNewsUrl(query) {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

module.exports = { fetchFeed, parseItems, googleNewsUrl };

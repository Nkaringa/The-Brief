import { useState, useEffect, useCallback } from 'react';
import NewsTicker from './components/NewsTicker';
import MarketTicker from './components/MarketTicker';
import CryptoTicker from './components/CryptoTicker';
import Header from './components/Header';
import OnThisDay from './components/OnThisDay';
import FilterNav from './components/FilterNav';
import NewsGrid from './components/NewsGrid';
import TopicResults from './components/TopicResults';
import PredictionMarkets from './components/PredictionMarkets';
import Footer from './components/Footer';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // matches /api/news edge cache
const DIGEST_LIMIT = 4;                  // stories per section on the "All" front page
const PINNED_KEY = 'pinned-topics';

function getStoredPinned() {
  try {
    const arr = JSON.parse(localStorage.getItem(PINNED_KEY));
    if (Array.isArray(arr)) return arr.filter(t => t && t.query);
  } catch {}
  return [];
}

function titleCase(s) {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export default function App() {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const [searchInput, setSearchInput] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [topicArticles, setTopicArticles] = useState(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicError, setTopicError] = useState(false);

  const [pinnedTopics, setPinnedTopics] = useState(getStoredPinned); // [{query, label}]
  const [pinnedData, setPinnedData] = useState({});                  // {query: articles[]}

  // ── Curated news (5 sections), with silent auto-refresh ──────────────
  const fetchNews = useCallback((background = false) => {
    return fetch('/api/news')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (!data || typeof data.news !== 'object' || data.news === null) throw new Error();
        setNewsData(data);
        setError(false);
        if (!background) setLoading(false);
      })
      .catch(() => { if (!background) { setError(true); setLoading(false); } });
  }, []);

  useEffect(() => { fetchNews(false); }, [fetchNews]);

  useEffect(() => {
    const interval = setInterval(() => fetchNews(true), POLL_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNews(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchNews]);

  // ── Pinned topics: fetch any we don't have data for yet ──────────────
  useEffect(() => {
    pinnedTopics.forEach(t => {
      if (pinnedData[t.query]) return;
      fetch(`/api/topic?q=${encodeURIComponent(t.query)}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && Array.isArray(data.articles)) {
            setPinnedData(prev => ({ ...prev, [t.query]: data.articles }));
          }
        })
        .catch(() => {});
    });
  }, [pinnedTopics, pinnedData]);

  // ── Single-topic view (search result or pinned deep-dive) ────────────
  const openTopic = useCallback((query) => {
    const q = query.trim();
    if (!q) return;
    setActiveFilter('all');
    setActiveTopic(q);
    setTopicArticles(null);
    setTopicError(false);
    setTopicLoading(true);
    fetch(`/api/topic?q=${encodeURIComponent(q)}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (!data || !Array.isArray(data.articles)) throw new Error();
        setTopicArticles(data.articles);
        setTopicLoading(false);
        setPinnedData(prev => (prev[q] ? { ...prev, [q]: data.articles } : prev)); // refresh pinned cache
      })
      .catch(() => { setTopicError(true); setTopicLoading(false); });
  }, []);

  const exitTopic = useCallback(() => {
    setActiveTopic('');
    setTopicArticles(null);
    setTopicError(false);
    setTopicLoading(false);
    setSearchInput('');
  }, []);

  const handleFilterChange = useCallback((cat) => {
    setActiveFilter(cat);
    setActiveTopic('');
    setTopicArticles(null);
    setTopicError(false);
    setSearchInput('');
  }, []);

  // ── Pin / unpin ──────────────────────────────────────────────────────
  const savePinned = useCallback((next) => {
    setPinnedTopics(next);
    try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const isPinned = (q) => pinnedTopics.some(t => t.query.toLowerCase() === q.toLowerCase());

  const pinTopic = useCallback((query) => {
    const q = query.trim();
    if (!q || pinnedTopics.some(t => t.query.toLowerCase() === q.toLowerCase())) return;
    savePinned([...pinnedTopics, { query: q, label: titleCase(q) }]);
    if (topicArticles) setPinnedData(prev => ({ ...prev, [q]: topicArticles }));
  }, [pinnedTopics, savePinned, topicArticles]);

  const unpinTopic = useCallback((query) => {
    savePinned(pinnedTopics.filter(t => t.query !== query));
    if (activeTopic === query) exitTopic();
  }, [pinnedTopics, savePinned, activeTopic, exitTopic]);

  const categories = newsData ? Object.keys(newsData.news) : [];

  // ── Build the columns (and front-page lead) for the current view ─────
  let columns = null;
  let lead = null;
  if (!activeTopic && newsData) {
    if (activeFilter === 'all') {
      // Lead = top story of the highest-priority section that has news.
      const LEAD_PRIORITY = ['war', 'stocks', 'tech', 'crypto', 'cyber'];
      for (const sec of LEAD_PRIORITY) {
        const arr = newsData.news[sec];
        if (arr && arr.length) { lead = { story: arr[0], section: sec }; break; }
      }
      columns = categories.map(cat => {
        const all = newsData.news[cat] || [];
        // Skip the lead in its own column so it isn't shown twice.
        const items = (lead && cat === lead.section) ? all.slice(1, 1 + DIGEST_LIMIT) : all.slice(0, DIGEST_LIMIT);
        return { key: cat, items, count: all.length, onMore: () => handleFilterChange(cat) };
      });
      pinnedTopics.forEach(t => {
        const all = pinnedData[t.query] || [];
        columns.push({ key: t.query, label: t.label, items: all.slice(0, DIGEST_LIMIT), count: all.length, onMore: () => openTopic(t.query) });
      });
    } else {
      const all = newsData.news[activeFilter] || [];
      columns = [{ key: activeFilter, items: all, count: all.length, onMore: null, wide: true }];
    }
  }

  return (
    <>
      <NewsTicker newsData={newsData?.news} />
      <MarketTicker />
      <CryptoTicker />
      <Header date={newsData?.date} />
      <OnThisDay />
      <FilterNav
        categories={categories}
        activeFilter={activeFilter}
        activeTopic={activeTopic}
        pinnedTopics={pinnedTopics}
        searchInput={searchInput}
        onFilterChange={handleFilterChange}
        onSelectTopic={openTopic}
        onUnpinTopic={unpinTopic}
        onSearchChange={setSearchInput}
        onSearchSubmit={openTopic}
      />
      <main>
        <div className="page">
          <div className="content">
            {activeTopic ? (
              <TopicResults
                query={activeTopic}
                articles={topicArticles}
                loading={topicLoading}
                error={topicError}
                isPinned={isPinned(activeTopic)}
                onBack={exitTopic}
                onPin={() => pinTopic(activeTopic)}
                onUnpin={() => unpinTopic(activeTopic)}
              />
            ) : (
              <NewsGrid columns={columns} loading={loading} error={error} masonry={activeFilter === 'all'} lead={lead} />
            )}
          </div>
          <aside className="rail">
            <PredictionMarkets query={activeTopic || null} />
          </aside>
        </div>
      </main>
      <Footer date={newsData?.date} />
    </>
  );
}

import CategoryCard from './CategoryCard';

export default function NewsGrid({ newsData, loading, error, activeFilter, searchQuery }) {
  if (loading) {
    return (
      <div className="news-grid" id="news">
        <div className="loading-state">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-grid" id="news">
        <div className="error-state">
          <p className="error-code">503</p>
          <p className="error-msg">News feed unavailable</p>
          <code>Check /api/news in Vercel function logs</code>
        </div>
      </div>
    );
  }

  if (!newsData) return <div className="news-grid" id="news" />;

  const query = searchQuery.trim().toLowerCase();
  const visible = Object.keys(newsData)
    .filter(cat => activeFilter === 'all' || cat === activeFilter)
    .map(cat => ({
      cat,
      items: (Array.isArray(newsData[cat]) ? newsData[cat] : [])
        .filter(item => !query || item.title.toLowerCase().includes(query)),
    }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <div className="news-grid" id="news">
        {visible.map(({ cat, items }, idx) => (
          <CategoryCard
            key={cat}
            category={cat}
            items={items}
            animationDelay={`${0.05 + idx * 0.08}s`}
          />
        ))}
      </div>
      {visible.length === 0 && (
        <div className="no-results">
          <p className="no-results-icon">◎</p>
          <p className="no-results-msg">No headlines match your search</p>
        </div>
      )}
    </>
  );
}

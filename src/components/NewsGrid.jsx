import CategoryCard from './CategoryCard';
import LeadStory from './LeadStory';

export default function NewsGrid({ columns, loading, error, masonry, lead }) {
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

  if (!columns) return <div className="news-grid" id="news" />;

  const visible = columns.filter(col => col.items.length > 0);

  return (
    <>
      {lead && <LeadStory story={lead.story} section={lead.section} />}
      <div className={`news-grid${masonry ? ' news-grid--masonry' : ''}`} id="news">
        {visible.map((col, idx) => (
          <CategoryCard
            key={col.key}
            category={col.key}
            label={col.label}
            items={col.items}
            count={col.count}
            onMore={col.onMore}
            wide={col.wide}
            animationDelay={`${0.05 + idx * 0.07}s`}
          />
        ))}
      </div>
    </>
  );
}

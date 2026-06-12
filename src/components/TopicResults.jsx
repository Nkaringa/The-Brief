import CategoryCard from './CategoryCard';

// Topic-search view: shown in place of the section grid while a search is active.
export default function TopicResults({ query, articles, loading, error, isPinned, onBack, onPin, onUnpin }) {
  const ready = !loading && !error && articles && articles.length > 0;

  return (
    <div className="topic-view">
      <div className="topic-bar">
        <button className="topic-back" onClick={onBack} type="button">
          <span aria-hidden="true">←</span> Back to sections
        </button>
        {ready && (
          isPinned ? (
            <button className="topic-pin is-pinned" onClick={onUnpin} type="button">
              ✓ Pinned · Remove
            </button>
          ) : (
            <button className="topic-pin" onClick={onPin} type="button">
              + Pin to sections
            </button>
          )
        )}
      </div>

      {loading && (
        <div className="news-grid">
          <div className="loading-state">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="news-grid">
          <div className="error-state">
            <p className="error-code">503</p>
            <p className="error-msg">Couldn’t load “{query}”</p>
            <code>Try again or search a different topic</code>
          </div>
        </div>
      )}

      {!loading && !error && articles && articles.length === 0 && (
        <div className="no-results">
          <p className="no-results-icon">◎</p>
          <p className="no-results-msg">No headlines found for “{query}”</p>
        </div>
      )}

      {ready && (
        <div className="news-grid">
          <CategoryCard category={query} label={query} items={articles} count={articles.length} wide />
        </div>
      )}
    </div>
  );
}

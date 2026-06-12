import { categoryLabel } from '../categories';

export default function FilterNav({
  categories,
  activeFilter,
  activeTopic,
  pinnedTopics,
  searchInput,
  onFilterChange,
  onSelectTopic,
  onUnpinTopic,
  onSearchChange,
  onSearchSubmit,
}) {
  // A section tab is active only on the curated view, never mid-topic.
  const tabClass = (key) => `section-tab${!activeTopic && activeFilter === key ? ' active' : ''}`;

  return (
    <nav className="filter-nav" id="filter-nav">
      <div className="filter-inner">
        <span className="filter-eyebrow">Section</span>
        <div className="section-tabs" id="filter-pills">
          <button className={tabClass('all')} onClick={() => onFilterChange('all')}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} className={tabClass(cat)} onClick={() => onFilterChange(cat)}>
              {categoryLabel(cat)}
            </button>
          ))}
          {pinnedTopics.map(t => (
            <span key={t.query} className={`section-tab section-tab--pinned${activeTopic === t.query ? ' active' : ''}`}>
              <button className="section-tab-btn" onClick={() => onSelectTopic(t.query)}>
                {t.label}
              </button>
              <button
                className="section-tab-remove"
                onClick={() => onUnpinTopic(t.query)}
                aria-label={`Unpin ${t.label}`}
              >✕</button>
            </span>
          ))}
        </div>
        <form
          className="search-wrap"
          onSubmit={e => { e.preventDefault(); onSearchSubmit(searchInput); }}
          role="search"
        >
          <svg className="search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            id="search-input"
            className="search-input"
            placeholder="Search any topic…"
            autoComplete="off"
            spellCheck="false"
            value={searchInput}
            onChange={e => onSearchChange(e.target.value)}
          />
        </form>
      </div>
    </nav>
  );
}

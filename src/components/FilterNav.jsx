const CATEGORY_META = {
  tech:   { label: 'Technology' },
  stocks: { label: 'Markets' },
  war:    { label: 'World' },
  crypto: { label: 'Crypto' },
  cyber:  { label: 'Cybersecurity' },
};

export default function FilterNav({ categories, activeFilter, searchQuery, onFilterChange, onSearchChange }) {
  return (
    <nav className="filter-nav" id="filter-nav">
      <div className="filter-inner">
        <span className="filter-eyebrow">Section</span>
        <div className="filter-pills" id="filter-pills">
          <button
            className={`filter-btn${activeFilter === 'all' ? ' active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          {categories.map(cat => {
            const label = CATEGORY_META[cat]?.label ?? cat.toUpperCase();
            return (
              <button
                key={cat}
                className={`filter-btn${activeFilter === cat ? ' active' : ''}`}
                onClick={() => onFilterChange(cat)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            id="search-input"
            className="search-input"
            placeholder="Search headlines…"
            autoComplete="off"
            spellCheck="false"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </nav>
  );
}

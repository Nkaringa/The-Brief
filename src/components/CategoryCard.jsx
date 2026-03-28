const CATEGORY_META = {
  tech:   { icon: '⚡', label: 'Technology' },
  stocks: { icon: '📈', label: 'Markets' },
  war:    { icon: '🌐', label: 'World' },
  crypto: { icon: '₿',  label: 'Crypto' },
  cyber:  { icon: '🔒', label: 'Cybersecurity' },
};

function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
  } catch {
    return '#';
  }
}

export default function CategoryCard({ category, items, animationDelay }) {
  const meta = CATEGORY_META[category] ?? { icon: '📰', label: category };
  return (
    <div className="category-card" data-category={category} style={{ animationDelay }}>
      <div className="card-head">
        <span className="cat-icon">{meta.icon}</span>
        <span className="cat-label">{meta.label}</span>
        <span className="story-count">{items.length} stories</span>
      </div>
      <div className="card-body">
        {items.map((item, i) => (
          <div key={i} className="news-item">
            <span className="item-num">{String(i + 1).padStart(2, '0')}</span>
            <a href={safeUrl(item.link)} target="_blank" rel="noopener noreferrer">
              <span>{item.title}</span>
              <span className="link-arrow">↗</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

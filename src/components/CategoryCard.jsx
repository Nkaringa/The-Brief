import { categoryMeta } from '../categories';
import { parseHeadline, safeUrl } from '../util';

export default function CategoryCard({ category, label, items, count, onMore, wide, animationDelay }) {
  const meta = categoryMeta(category);
  return (
    <div
      className={`category-card${wide ? ' category-card--wide' : ''}`}
      data-category={category}
      style={{ animationDelay }}
    >
      <div className="card-head">
        <span className="cat-icon">{meta.icon}</span>
        <span className="cat-label">{label || meta.label}</span>
        <span className="story-count">{count ?? items.length} stories</span>
      </div>
      <div className="card-body">
        {items.map((item, i) => {
          const { headline, source } = parseHeadline(item.title);
          return (
            <div key={i} className="news-item">
              <span className="item-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="news-item-body">
                <a href={safeUrl(item.link)} target="_blank" rel="noopener noreferrer">
                  <span>{headline}</span>
                  <span className="link-arrow">↗</span>
                </a>
                {source && <span className="news-source">{source}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {onMore && (
        <button className="more-link" onClick={onMore} type="button">
          More <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

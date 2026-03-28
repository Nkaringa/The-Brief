import { useEffect, useRef } from 'react';

const CATEGORY_META = {
  tech:   { label: 'Technology' },
  stocks: { label: 'Markets' },
  war:    { label: 'World' },
  crypto: { label: 'Crypto' },
  cyber:  { label: 'Cybersecurity' },
};

export default function NewsTicker({ newsData }) {
  const scrollRef = useRef(null);

  const items = newsData
    ? Object.entries(newsData).flatMap(([cat, articles]) => {
        const label = CATEGORY_META[cat]?.label ?? cat.toUpperCase();
        return articles.map((a, i) => ({ id: `${cat}-${i}`, label, title: a.title }));
      })
    : [];

  useEffect(() => {
    if (!scrollRef.current || items.length === 0) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const w = scrollRef.current.scrollWidth / 2;
      const duration = Math.max(40, w / 90);
      scrollRef.current.style.animationDuration = `${duration}s`;
    });
  }, [items.length]);

  return (
    <div className="ticker-bar">
      <div className="ticker-label">
        <span className="live-dot" />
        LIVE
      </div>
      <div className="ticker-track">
        <div className="ticker-scroll" ref={scrollRef}>
          {[...items, ...items].map((item, idx) => (
            <span key={idx}>
              <span className="ticker-item">
                <span className="ticker-cat">{item.label}</span>
                {item.title}
              </span>
              <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

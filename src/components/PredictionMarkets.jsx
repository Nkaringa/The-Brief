import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL_MS = 2 * 60 * 1000;

function formatVol(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + n;
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PredictionMarkets({ query }) {
  const [markets, setMarkets] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const fetchMarkets = useCallback(() => {
    const url = query ? `/api/predictions?q=${encodeURIComponent(query)}` : '/api/predictions';
    fetch(url)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setMarkets(data && Array.isArray(data.markets) ? data.markets : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [query]);

  useEffect(() => {
    setMarkets(null);
    setLoaded(false);
    fetchMarkets();
    // Only poll the global (front-page) forecasts; topic forecasts are one-shot.
    if (query) return;
    const interval = setInterval(fetchMarkets, POLL_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMarkets(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchMarkets, query]);

  // Global rail with no data → render nothing. Topic rail handles its own empty state.
  if (!query && (!markets || markets.length === 0)) return null;
  if (query && !loaded) return null;

  const heading = query ? `Forecasts · ${query}` : 'Prediction Markets';

  return (
    <section className="predictions" aria-label="Prediction markets">
      <div className="predictions-inner">
        <div className="predictions-head">
          <span className="predictions-title">{heading}</span>
          <span className="predictions-source">via Polymarket</span>
        </div>

        {query && markets.length === 0 ? (
          <p className="predictions-empty">No related forecasts.</p>
        ) : (
          <div className="predictions-list">
            {markets.slice(0, 8).map((m, i) => {
              const meta = [];
              if (m.outcome) meta.push(<span key="o" className="pred-meta-out">{m.outcome}</span>);
              if (m.change24h != null && m.change24h !== 0) {
                meta.push(
                  <span key="c" className={`pred-mom ${m.change24h > 0 ? 'up' : 'dn'}`}>
                    {m.change24h > 0 ? '▲' : '▼'}{Math.abs(m.change24h)}
                  </span>
                );
              }
              if (m.volume > 0) meta.push(<span key="v">{formatVol(m.volume)}</span>);
              const date = m.endDate && formatDate(m.endDate);
              if (date) meta.push(<span key="d">{date}</span>);

              return (
                <a key={i} className="prediction-row" href={m.url} target="_blank" rel="noopener noreferrer">
                  <span className="prediction-label">
                    <span className="prediction-q">{m.title}</span>
                    {meta.length > 0 && (
                      <span className="prediction-meta">
                        {meta.map((node, idx) => (
                          <span key={idx} className="pred-meta-item">
                            {idx > 0 && <span className="pred-dot" aria-hidden="true">·</span>}
                            {node}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="prediction-meter">
                    <span className="prediction-bar">
                      <span className="prediction-fill" style={{ width: `${m.probability}%` }} />
                    </span>
                    <span className="prediction-pct">{m.probability}%</span>
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

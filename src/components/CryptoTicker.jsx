import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 60 * 1000; // matches /api/crypto edge cache (s-maxage=60)
const STORAGE_KEY = 'crypto-coins';
const DEFAULT_COINS = [
  { id: 'bitcoin',  symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana',   symbol: 'SOL' },
];

function getStoredCoins() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0 && saved.every(c => c && c.id)) return saved;
  } catch {}
  return [...DEFAULT_COINS];
}

// Fear & Greed runs 0–100; colour it by sentiment band.
function fngClass(value) {
  if (value <= 44) return 'dn';   // fear → red
  if (value >= 56) return 'up';   // greed → green
  return 'flat';                  // neutral
}

function formatPrice(p) {
  if (p >= 1000) return '$' + Math.round(p).toLocaleString('en-US');
  if (p >= 1) return '$' + p.toFixed(2);
  return '$' + p.toFixed(4);
}

export default function CryptoTicker() {
  const [coins, setCoins] = useState(getStoredCoins);     // user selection [{id, symbol}]
  const [quotes, setQuotes] = useState([]);               // fetched prices [{id, symbol, price, change_pct}]
  const [fearGreed, setFearGreed] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const scrollRef = useRef(null);
  const managerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const fetchCrypto = useCallback((list) => {
    if (!list.length) { setQuotes([]); return; }
    const ids = list.map(c => c.id).join(',');
    fetch(`/api/crypto?ids=${encodeURIComponent(ids)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.coins)) setQuotes(data.coins);
        if (data && data.fearGreed) setFearGreed(data.fearGreed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCrypto(coins);
    const interval = setInterval(() => fetchCrypto(coins), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCrypto(coins);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [coins, fetchCrypto]);

  // Scale scroll speed to content width, like the market ticker.
  useEffect(() => {
    if (!scrollRef.current || !quotes.length) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const w = scrollRef.current.scrollWidth / 2;
      const duration = Math.max(20, w / 80);
      scrollRef.current.style.animationDuration = `${duration}s`;
    });
  }, [quotes]);

  // Close manager on outside click.
  useEffect(() => {
    const handle = (e) => {
      if (managerOpen && managerRef.current && !managerRef.current.contains(e.target)) {
        setManagerOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [managerOpen]);

  function saveCoins(next) {
    setCoins(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function addCoin(coin) {
    if (!coin || !coin.id || coins.some(c => c.id === coin.id)) return;
    saveCoins([...coins, { id: coin.id, symbol: coin.symbol }]);
    setAddInput('');
    setSearchResults([]);
  }

  function removeCoin(id) {
    saveCoins(coins.filter(c => c.id !== id));
  }

  function handleInputChange(val) {
    setAddInput(val);
    clearTimeout(searchTimerRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(() => {
      fetch(`/api/crypto-search?q=${encodeURIComponent(val.trim())}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => setSearchResults(data?.results ?? []))
        .catch(() => setSearchResults([]));
    }, 300);
  }

  return (
    <div className="crypto-bar" id="crypto-bar">
      <div className="crypto-label">
        <span className="crypto-mark" aria-hidden="true">₿</span>
        CRYPTO
      </div>

      <div className="market-ticker-track">
        {quotes.length === 0 ? (
          <span className="market-unavailable">Crypto data unavailable</span>
        ) : (
          <div className="market-ticker-scroll" ref={scrollRef}>
            {[...quotes, ...quotes].map((c, idx) => {
              const dir = c.change_pct > 0 ? 'up' : c.change_pct < 0 ? 'dn' : 'flat';
              const arrow = c.change_pct > 0 ? '▲' : c.change_pct < 0 ? '▼' : '–';
              const sign = c.change_pct > 0 ? '+' : '';
              return (
                <span key={idx} className="crypto-item">
                  <span className="crypto-symbol">{c.symbol}</span>
                  <span className="crypto-price">{formatPrice(c.price)}</span>
                  <span className={`crypto-change ${dir}`}>{arrow} {sign}{c.change_pct.toFixed(2)}%</span>
                  <span className="market-sep" aria-hidden="true">◆</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {fearGreed && (
        <span className="crypto-fng">
          <span className="crypto-fng-label">Fear &amp; Greed</span>
          <span className={`crypto-fng-value ${fngClass(fearGreed.value)}`}>
            {fearGreed.value} · {fearGreed.label}
          </span>
        </span>
      )}

      <button
        className="market-settings-btn"
        onClick={(e) => { e.stopPropagation(); setManagerOpen(o => !o); }}
        aria-label="Manage crypto coins"
      >
        ⚙ Manage Crypto
      </button>

      {managerOpen && (
        <div className="market-manager" ref={managerRef}>
          <p className="market-manager-title">Manage Crypto</p>
          <div className="market-manager-list">
            {coins.length === 0 ? (
              <div className="market-manager-empty">No coins selected.</div>
            ) : (
              coins.map(c => (
                <div key={c.id} className="market-manager-row">
                  <span className="market-manager-sym">{c.symbol}</span>
                  <button
                    className="market-manager-remove"
                    onClick={() => removeCoin(c.id)}
                    aria-label={`Remove ${c.symbol}`}
                  >✕</button>
                </div>
              ))
            )}
          </div>
          <div className="market-manager-add-row">
            <div className="market-search-wrap">
              <input
                type="text"
                className="market-manager-input"
                placeholder="Search coin (e.g. dogecoin)"
                autoComplete="off"
                spellCheck="false"
                maxLength={40}
                value={addInput}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchResults[0]) { addCoin(searchResults[0]); e.preventDefault(); }
                  else if (e.key === 'Escape') setManagerOpen(false);
                }}
                onBlur={() => setTimeout(() => setSearchResults([]), 150)}
              />
              {searchResults.length > 0 && (
                <div className="market-search-dropdown">
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      className="market-search-result"
                      onMouseDown={e => { e.preventDefault(); addCoin(r); }}
                    >
                      {r.name} ({r.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

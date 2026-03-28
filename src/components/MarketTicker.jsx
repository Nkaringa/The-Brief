import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'MSFT', 'NVDA', 'TSLA'];
const STORAGE_KEY = 'market-symbols';

function getStoredSymbols() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch {}
  return [...DEFAULT_SYMBOLS];
}

function normalizeSymbol(input) {
  const s = input.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '');
  return s.length >= 1 && s.length <= 12 ? s : null;
}

export default function MarketTicker() {
  const [symbols, setSymbols] = useState(getStoredSymbols);
  const [quotes, setQuotes] = useState([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const scrollRef = useRef(null);
  const managerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const fetchQuotes = useCallback((syms) => {
    if (!syms.length) return;
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms.join(','))}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.symbols)) setQuotes(data.symbols);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchQuotes(symbols);
  }, [symbols, fetchQuotes]);

  useEffect(() => {
    if (!scrollRef.current || !quotes.length) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const w = scrollRef.current.scrollWidth / 2;
      const duration = Math.max(20, w / 80);
      scrollRef.current.style.animationDuration = `${duration}s`;
    });
  }, [quotes]);

  // Close manager on outside click
  useEffect(() => {
    const handle = (e) => {
      if (managerOpen && managerRef.current && !managerRef.current.contains(e.target)) {
        setManagerOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [managerOpen]);

  function saveSymbols(next) {
    setSymbols(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function addSymbol(sym) {
    const normalized = normalizeSymbol(sym);
    if (!normalized || symbols.includes(normalized)) return;
    saveSymbols([...symbols, normalized]);
    setAddInput('');
    setSearchResults([]);
  }

  function removeSymbol(sym) {
    saveSymbols(symbols.filter(s => s !== sym));
  }

  function handleInputChange(val) {
    setAddInput(val);
    clearTimeout(searchTimerRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(val.trim())}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setSearchResults(data?.results ?? []))
        .catch(() => setSearchResults([]));
    }, 300);
  }

  return (
    <div className="market-ticker-bar" id="market-ticker-bar">
      <div className="market-ticker-label">
        <svg className="market-icon" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          <polyline points="1,9 4,4 7,6 11,1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        MARKETS
      </div>

      <div className="market-ticker-track">
        {quotes.length === 0 ? (
          <span className="market-unavailable">Market data unavailable</span>
        ) : (
          <div className="market-ticker-scroll" ref={scrollRef}>
            {[...quotes, ...quotes].map((sym, idx) => {
              const sign  = sym.change > 0 ? '+' : '';
              const dir   = sym.change > 0 ? 'up' : sym.change < 0 ? 'dn' : 'flat';
              const arrow = sym.change > 0 ? '▲' : sym.change < 0 ? '▼' : '–';
              return (
                <span key={idx} className="market-item">
                  <span className="market-symbol">{sym.symbol}</span>
                  <span className="market-price">${sym.price.toFixed(2)}</span>
                  <span className={`market-change ${dir}`}>{arrow} {sign}{sym.change_pct.toFixed(2)}%</span>
                  <span className="market-sep" aria-hidden="true">◆</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="market-settings-btn"
        onClick={(e) => { e.stopPropagation(); setManagerOpen(o => !o); }}
        aria-label="Manage ticker symbols"
      >
        ⚙ Manage Ticker
      </button>

      {managerOpen && (
        <div className="market-manager" ref={managerRef}>
          <p className="market-manager-title">Manage Ticker</p>
          <div className="market-manager-list">
            {symbols.length === 0 ? (
              <div className="market-manager-empty">No symbols selected.</div>
            ) : (
              symbols.map(sym => (
                <div key={sym} className="market-manager-row">
                  <span className="market-manager-sym">{sym}</span>
                  <button
                    className="market-manager-remove"
                    onClick={() => removeSymbol(sym)}
                    aria-label={`Remove ${sym}`}
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
                placeholder="Search or enter symbol"
                autoComplete="off"
                spellCheck="false"
                maxLength={40}
                value={addInput}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { addSymbol(addInput); e.preventDefault(); }
                  else if (e.key === 'Escape') setManagerOpen(false);
                }}
                onBlur={() => setTimeout(() => setSearchResults([]), 150)}
              />
              {searchResults.length > 0 && (
                <div className="market-search-dropdown">
                  {searchResults.map(r => (
                    <button
                      key={r.symbol}
                      type="button"
                      className="market-search-result"
                      onMouseDown={e => { e.preventDefault(); addSymbol(r.symbol); }}
                    >
                      {r.name} ({r.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="market-manager-add-btn" onClick={() => addSymbol(addInput)}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

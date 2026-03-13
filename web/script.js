// ─── THEME ─────────────────────────────────────────────────────
(function () {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
                || (!document.documentElement.hasAttribute('data-theme')
                    && window.matchMedia('(prefers-color-scheme: dark)').matches);
            const next = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    });
})();


const CATEGORY_META = {
    tech:   { icon: '⚡', label: 'Technology' },
    stocks: { icon: '📈', label: 'Markets' },
    war:    { icon: '🌐', label: 'World' },
    crypto: { icon: '₿',  label: 'Crypto' },
    cyber:  { icon: '🔒', label: 'Cybersecurity' },
};

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeUrl(url) {
    try {
        const u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch {
        return '#';
    }
}

function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function parseDate(dateStr) {
    const normalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

const DISPLAY_TIME_ZONE = 'America/Indiana/Indianapolis';
let footerClockTimer = null;

function formatLiveTime(date = new Date()) {
    return date.toLocaleString('en-US', {
        timeZone: DISPLAY_TIME_ZONE,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });
}

function formatFooterUpdated(dateStr) {
    const date = parseDate(dateStr);
    if (!date) return dateStr;

    return date.toLocaleString('en-US', {
        timeZone: DISPLAY_TIME_ZONE,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });
}

function startFooterClock() {
    const footerTime = document.getElementById('footer-time');
    if (!footerTime) return;

    const render = () => {
        footerTime.textContent = formatLiveTime();
    };

    render();

    if (footerClockTimer !== null) {
        clearInterval(footerClockTimer);
    }

    footerClockTimer = setInterval(render, 1000);
}

function updateFooterTimes(dateStr) {
    const footerTimeUpdated = document.getElementById('footer-time-updated');

    startFooterClock();
    if (footerTimeUpdated) footerTimeUpdated.textContent = formatFooterUpdated(dateStr);
}

// ─── TICKER ───────────────────────────────────────────────────
function buildTicker(newsData) {
    const scroll = document.getElementById('ticker-scroll');
    if (!scroll) return;

    const items = [];
    Object.entries(newsData).forEach(([cat, articles]) => {
        const meta = CATEGORY_META[cat] || { icon: '📰', label: cat.toUpperCase() };
        articles.forEach(a => {
            items.push(`<span class="ticker-item"><span class="ticker-cat">${escapeHtml(meta.label)}</span>${escapeHtml(a.title)}</span><span class="ticker-sep">◆</span>`);
        });
    });

    if (items.length === 0) return;

    const html = items.join('');
    scroll.innerHTML = html + html; // duplicate for seamless loop

    // Tune speed to content width
    requestAnimationFrame(() => {
        const w = scroll.scrollWidth / 2;
        const duration = Math.max(40, w / 90); // 90px/s
        scroll.style.animationDuration = `${duration}s`;
    });
}


// ─── MARKET TICKER ────────────────────────────────────────────

const MARKET_STORAGE_KEY = 'market-symbols';

// All symbols available in the picker (must match api/quotes.js allowlist)
const AVAILABLE_SYMBOLS = [
    { symbol: 'SPY',   name: 'S&P 500'      },
    { symbol: 'QQQ',   name: 'Nasdaq 100'   },
    { symbol: 'DIA',   name: 'Dow Jones'    },
    { symbol: 'IWM',   name: 'Russell 2000' },
    { symbol: 'GLD',   name: 'Gold'         },
    { symbol: 'AAPL',  name: 'Apple'        },
    { symbol: 'MSFT',  name: 'Microsoft'    },
    { symbol: 'NVDA',  name: 'NVIDIA'       },
    { symbol: 'TSLA',  name: 'Tesla'        },
    { symbol: 'AMZN',  name: 'Amazon'       },
    { symbol: 'META',  name: 'Meta'         },
    { symbol: 'GOOGL', name: 'Alphabet'     },
    { symbol: 'JPM',   name: 'JPMorgan'     },
    { symbol: 'V',     name: 'Visa'         },
    { symbol: 'AMD',   name: 'AMD'          },
    { symbol: 'COIN',  name: 'Coinbase'     },
];

const DEFAULT_SYMBOLS = new Set(['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'MSFT', 'NVDA', 'TSLA']);

function getEnabledSymbols() {
    try {
        const saved = localStorage.getItem(MARKET_STORAGE_KEY);
        if (saved) {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
        }
    } catch {}
    return new Set(DEFAULT_SYMBOLS);
}

function saveEnabledSymbols(enabledSet) {
    try { localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify([...enabledSet])); } catch {}
}

function formatMarketItem(sym) {
    const sign  = sym.change > 0 ? '+' : '';
    const dir   = sym.change > 0 ? 'up' : sym.change < 0 ? 'dn' : 'flat';
    const arrow = sym.change > 0 ? '▲' : sym.change < 0 ? '▼' : '–';
    return `<span class="market-item">` +
        `<span class="market-symbol">${escapeHtml(sym.symbol)}</span>` +
        `<span class="market-price">$${escapeHtml(sym.price.toFixed(2))}</span>` +
        `<span class="market-change ${dir}">${arrow} ${sign}${escapeHtml(sym.change_pct.toFixed(2))}%</span>` +
        `</span><span class="market-sep" aria-hidden="true">◆</span>`;
}

function buildMarketTicker(quotes) {
    const scroll = document.getElementById('market-ticker-scroll');
    if (!scroll) return;
    if (quotes.length === 0) { scroll.innerHTML = ''; return; }

    const html = quotes.map(formatMarketItem).join('');
    scroll.innerHTML = html + html; // duplicate for seamless loop

    requestAnimationFrame(() => {
        const w = scroll.scrollWidth / 2;
        const duration = Math.max(20, w / 80); // ~80px/s
        scroll.style.animationDuration = `${duration}s`;
    });
}

function buildMarketPicker(enabledSet) {
    const list = document.getElementById('market-picker-list');
    if (!list) return;
    list.innerHTML = '';

    AVAILABLE_SYMBOLS.forEach(sym => {
        const row = document.createElement('div');
        row.className = 'market-picker-row';
        const id = `mkt-${sym.symbol}`;
        const checked = enabledSet.has(sym.symbol) ? 'checked' : '';
        row.innerHTML =
            `<input type="checkbox" id="${escapeHtml(id)}" ${checked} data-symbol="${escapeHtml(sym.symbol)}">` +
            `<label for="${escapeHtml(id)}">` +
            `<span class="market-picker-sym">${escapeHtml(sym.symbol)}</span>` +
            `<span>${escapeHtml(sym.name)}</span>` +
            `</label>`;
        list.appendChild(row);
    });
}

function fetchMarketQuotes(enabledSet) {
    const symbols = [...enabledSet].join(',');
    return fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => (data && Array.isArray(data.symbols)) ? data.symbols : [])
        .catch(() => []);
}

function initMarketTicker() {
    let enabledSet = getEnabledSymbols();
    buildMarketPicker(enabledSet);

    const btn    = document.getElementById('market-settings-btn');
    const picker = document.getElementById('market-picker');
    if (!btn || !picker) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        picker.hidden = !picker.hidden;
    });

    document.addEventListener('click', e => {
        if (!picker.hidden && !picker.contains(e.target) && e.target !== btn) {
            picker.hidden = true;
        }
    });

    picker.addEventListener('change', e => {
        const cb = e.target.closest('input[type="checkbox"]');
        if (!cb) return;
        const sym = cb.dataset.symbol;
        if (cb.checked) enabledSet.add(sym);
        else enabledSet.delete(sym);
        saveEnabledSymbols(enabledSet);
        fetchMarketQuotes(enabledSet).then(buildMarketTicker);
    });

    fetchMarketQuotes(enabledSet).then(buildMarketTicker);
}

initMarketTicker();


// ─── FILTER + SEARCH ──────────────────────────────────────────
let activeFilter = 'all';
let searchQuery  = '';
let filterTimer  = null;

function buildFilterButtons(categories) {
    const pills = document.getElementById('filter-pills');
    if (!pills) return;
    categories.forEach(cat => {
        const meta = CATEGORY_META[cat] || { icon: '📰', label: cat.toUpperCase() };
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat;
        btn.textContent = meta.label;
        pills.appendChild(btn);
    });

    pills.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        activeFilter = btn.dataset.filter;
        pills.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyView(true);
    });
}

// Unified view: applies both active category filter and search query.
// animate=true fades cards (used for category clicks); false is instant (search).
function applyView(animate) {
    if (filterTimer !== null) {
        clearTimeout(filterTimer);
        filterTimer = null;
    }

    const cards    = document.querySelectorAll('.category-card');
    const noResults = document.getElementById('no-results');
    const query    = searchQuery.trim().toLowerCase();

    const doUpdate = () => {
        let visibleCards = 0;

        cards.forEach(card => {
            const catMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
            if (!catMatch) {
                card.style.display = 'none';
                return;
            }

            // Filter individual items by search query
            const items = card.querySelectorAll('.news-item');
            let visibleItems = 0;
            items.forEach(item => {
                const titleEl = item.querySelector('a > span:first-child');
                const title = titleEl ? titleEl.textContent.toLowerCase() : '';
                const matches = !query || title.includes(query);
                item.style.display = matches ? '' : 'none';
                if (matches) visibleItems++;
            });

            if (visibleItems > 0) {
                card.style.display = '';
                visibleCards++;
                if (animate) {
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                }
            } else {
                card.style.display = 'none';
            }
        });

        if (noResults) noResults.classList.toggle('hidden', visibleCards > 0);
    };

    if (animate) {
        cards.forEach(c => {
            c.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            c.style.opacity = '0';
            c.style.transform = 'translateY(6px)';
        });
        filterTimer = setTimeout(() => { filterTimer = null; doUpdate(); }, 180);
    } else {
        doUpdate();
    }
}


// ─── CARD BUILDER ─────────────────────────────────────────────
function buildCard(category, items) {
    const meta = CATEGORY_META[category] || { icon: '📰', label: category };
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.category = category;

    card.innerHTML = `
        <div class="card-head">
            <span class="cat-icon">${escapeHtml(meta.icon)}</span>
            <span class="cat-label">${escapeHtml(meta.label)}</span>
            <span class="story-count">${items.length} stories</span>
        </div>
        <div class="card-body">
            ${items.map((item, i) => `
                <div class="news-item">
                    <span class="item-num">${String(i + 1).padStart(2, '0')}</span>
                    <a href="${escapeHtml(safeUrl(item.link))}" target="_blank" rel="noopener noreferrer">
                        <span>${escapeHtml(item.title)}</span><span class="link-arrow">↗</span>
                    </a>
                </div>
            `).join('')}
        </div>
    `;
    return card;
}


// ─── INIT ──────────────────────────────────────────────────────
const newsEl  = document.getElementById('news');
const errorEl = document.getElementById('error');

function showError(err) {
    console.error('Failed to load news:', err);
    if (newsEl) newsEl.innerHTML = '';
    if (errorEl) errorEl.classList.remove('hidden');
}

// Loading indicator
if (newsEl) {
    newsEl.innerHTML = `
        <div class="loading-state">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
        </div>`;
}

fetch('data/news.json')
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (!data || typeof data.news !== 'object' || data.news === null) {
            throw new Error('Invalid news data structure');
        }

        if (newsEl) newsEl.innerHTML = '';

        // Dates
        if (data.date) {
            const fmt = formatDate(data.date);
            const headerDate = document.getElementById('header-date');
            if (headerDate) headerDate.textContent = fmt;
            updateFooterTimes(data.date);
        }

        // Ticker
        buildTicker(data.news);

        // Filter buttons (dynamic from JSON)
        const categories = Object.keys(data.news);
        buildFilterButtons(categories);

        // Cards
        if (newsEl) {
            categories.forEach((cat, idx) => {
                const card = buildCard(cat, Array.isArray(data.news[cat]) ? data.news[cat] : []);
                card.style.animationDelay = `${0.05 + idx * 0.08}s`;
                newsEl.appendChild(card);
            });
        }

        // Wire up search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchQuery = searchInput.value;
                applyView(false);
            });
        }
    })
    .catch(showError);

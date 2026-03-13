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
const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'MSFT', 'NVDA', 'TSLA'];

function getStoredSymbols() {
    try {
        const saved = localStorage.getItem(MARKET_STORAGE_KEY);
        if (saved) {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr) && arr.length > 0) return arr;
        }
    } catch {}
    return [...DEFAULT_SYMBOLS];
}

function saveStoredSymbols(arr) {
    try { localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(arr)); } catch {}
}

// Normalize a user-typed symbol: uppercase, strip non-ticker chars, validate length
function normalizeSymbol(input) {
    const s = input.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '');
    return (s.length >= 1 && s.length <= 12) ? s : null;
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

    if (!quotes || quotes.length === 0) {
        scroll.style.animation = 'none';
        scroll.innerHTML = '<span class="market-unavailable">Market data unavailable</span>';
        return;
    }

    scroll.style.animation = '';
    const html = quotes.map(formatMarketItem).join('');
    scroll.innerHTML = html + html; // duplicate for seamless loop

    requestAnimationFrame(() => {
        const w = scroll.scrollWidth / 2;
        const duration = Math.max(20, w / 80); // ~80px/s
        scroll.style.animationDuration = `${duration}s`;
    });
}

function buildManagerList(symbols) {
    const list = document.getElementById('market-manager-list');
    if (!list) return;
    list.innerHTML = '';

    if (symbols.length === 0) {
        list.innerHTML = '<div class="market-manager-empty">No symbols selected.</div>';
        return;
    }

    symbols.forEach(sym => {
        const row = document.createElement('div');
        row.className = 'market-manager-row';
        row.innerHTML =
            `<span class="market-manager-sym">${escapeHtml(sym)}</span>` +
            `<button class="market-manager-remove" data-symbol="${escapeHtml(sym)}" aria-label="Remove ${escapeHtml(sym)}">✕</button>`;
        list.appendChild(row);
    });
}

function fetchMarketQuotes(symbols) {
    if (!symbols || symbols.length === 0) return Promise.resolve(null);
    const param = symbols.join(',');
    return fetch(`/api/quotes?symbols=${encodeURIComponent(param)}`)
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => (data && Array.isArray(data.symbols)) ? data.symbols : null)
        .catch(() => null);
}

function initMarketTicker() {
    let symbols = getStoredSymbols();

    const btn      = document.getElementById('market-settings-btn');
    const manager  = document.getElementById('market-manager');
    const addInput = document.getElementById('market-manager-input');
    const addBtn   = document.getElementById('market-manager-add-btn');
    if (!btn || !manager) return;

    function refresh() {
        buildManagerList(symbols);
        fetchMarketQuotes(symbols).then(buildMarketTicker);
    }

    buildManagerList(symbols);

    btn.addEventListener('click', e => {
        e.stopPropagation();
        manager.hidden = !manager.hidden;
        if (!manager.hidden && addInput) {
            addInput.value = '';
            setTimeout(() => addInput.focus(), 30);
        }
    });

    document.addEventListener('click', e => {
        if (!manager.hidden && !manager.contains(e.target) && e.target !== btn) {
            manager.hidden = true;
        }
    });

    function addSymbol() {
        if (!addInput) return;
        const sym = normalizeSymbol(addInput.value);
        if (!sym) return;
        if (!symbols.includes(sym)) {
            symbols.push(sym);
            saveStoredSymbols(symbols);
            refresh();
        }
        addInput.value = '';
    }

    if (addBtn) addBtn.addEventListener('click', addSymbol);

    if (addInput) {
        addInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { addSymbol(); e.preventDefault(); }
            else if (e.key === 'Escape') { manager.hidden = true; }
        });
    }

    manager.addEventListener('click', e => {
        const removeBtn = e.target.closest('.market-manager-remove');
        if (!removeBtn) return;
        const sym = removeBtn.dataset.symbol;
        symbols = symbols.filter(s => s !== sym);
        saveStoredSymbols(symbols);
        refresh();
    });

    fetchMarketQuotes(symbols).then(buildMarketTicker);
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

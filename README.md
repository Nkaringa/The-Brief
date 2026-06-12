# The Brief — Daily News

A magazine-style news digest. **The Brief** pulls live headlines from curated Google
News feeds, shows a real-time market ticker, and renders everything as a newspaper-style
front page. It runs as a React single-page app backed by serverless API functions, with
no database and no build-time data — every load fetches fresh.

## Live

https://news.npalakurla.com

## Tech stack

- **Frontend:** React 18 + Vite
- **Backend:** Vercel serverless functions (Node, no framework) under `api/`
- **News source:** Google News RSS (fetched and parsed on the server, per request)
- **Market data:** [Finnhub](https://finnhub.io/) (requires an API key; falls back to demo prices without one)
- **Hosting:** Vercel

## Repository layout

```
the-brief/
├── api/
│   ├── news.js            # Fetches + parses Google News RSS for 5 categories
│   ├── quotes.js          # Finnhub stock quotes for the market ticker
│   └── search.js          # Finnhub symbol search (ticker autocomplete)
├── src/
│   ├── App.jsx            # Root: fetches /api/news, holds filter/search state
│   ├── main.jsx           # React entry point
│   ├── categories.js      # Shared category metadata (labels + icons)
│   ├── index.css          # All styling (newspaper theme, light/dark)
│   └── components/
│       ├── NewsTicker.jsx     # Scrolling headline marquee
│       ├── MarketTicker.jsx   # Live stock ticker + symbol manager
│       ├── Header.jsx         # Masthead + light/dark theme toggle
│       ├── FilterNav.jsx      # Section pills + headline search
│       ├── NewsGrid.jsx       # Lays out the category cards
│       ├── CategoryCard.jsx   # One category's headlines
│       └── Footer.jsx         # Live clock + last-updated time
├── index.html             # Vite HTML shell
├── vite.config.js         # Vite + React, proxies /api to localhost:3000 in dev
└── vercel.json            # Build command + output directory
```

## How it works

1. **News** — `api/news.js` fetches 5 Google News RSS searches (`tech`, `stocks`,
   `war`, `crypto`, `cyber`), parses the XML with regex (handling redirects and CDATA),
   and returns the top 10 stories per category as `{ title, link }`. Responses are
   cached at the edge for 5 minutes. The React app fetches `/api/news` once on load.
2. **Markets** — `MarketTicker.jsx` calls `api/quotes.js` for live prices. Users can
   add/remove symbols (persisted in `localStorage`); `api/search.js` powers the
   symbol-search autocomplete. Without a `FINNHUB_API_KEY`, both endpoints return demo
   data so the UI still renders locally.
3. **UI** — headlines populate a live ticker, category cards with section filtering and
   client-side headline search, plus a light/dark theme toggle.

## Local development

```bash
npm install
```

The frontend and the serverless functions run separately in dev:

- **Full stack (recommended):** use the Vercel CLI so `/api/*` functions are served.
  ```bash
  npm i -g vercel        # once
  vercel dev             # serves the app + api/ on http://localhost:3000
  ```
- **Frontend only:** `npm run dev` starts Vite on `:5173` and proxies `/api` to
  `localhost:3000` (see `vite.config.js`). You still need the functions running on
  `:3000` for live data; otherwise the news/markets calls will fail to that target.

### Build

```bash
npm run build      # outputs static assets to dist/ (gitignored)
npm run preview    # serve the production build locally
```

## Configuration

| Variable | Required | Purpose |
|----------|----------|---------|
| `FINNHUB_API_KEY` | Optional | Live market quotes + symbol search. Without it, the ticker shows demo prices. Get a free key at [finnhub.io](https://finnhub.io/). |

Copy `.env.example` to `.env` for local use, or set the variable in the Vercel project
settings for production.

## Customizing the news feeds

Edit the `FEEDS` map in `api/news.js` to change the Google News search query for a
category, or add/remove categories. Display labels and icons live in
`src/categories.js` — add a matching entry there so new categories render with a proper
name and icon (unknown categories fall back to a generic label/icon).

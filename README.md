# The Brief — Daily News

A two-part news digest that (1) scrapes curated Google News RSS feeds into a structured JSON file and (2) renders a magazine-style front end called **The Brief**. Use it to produce a lightweight mini paper that can be refreshed on demand or on a schedule.

## Repository layout

```
news-app/
├── data/
│   └── news.json          # Latest cached headlines + metadata (generated)
├── scraper/
│   ├── scraper.py         # RSS fetcher -> data/news.json
│   └── scraper.log        # Optional log output from manual runs
├── web/
│   ├── index.html         # The Brief UI shell
│   ├── script.js          # Fetches JSON, builds ticker/cards/search
│   └── styles.css         # Newspaper-inspired styling + responsive rules
└── requirements.txt       # Python deps (feedparser)
```

## How it works

1. **Scraper (Python)**
   - Uses [`feedparser`](https://pypi.org/project/feedparser/) to hit 5 Google News RSS searches (`tech`, `stocks`, `war`, `crypto`, `cyber`).
   - Truncates each feed to the top 10 stories and normalizes to `{title, link}` objects.
   - Writes the payload plus a timestamp into `data/news.json`.

2. **Client (static web app)**
   - `web/index.html` loads `web/script.js`, which fetches `data/news.json` (the scraper now mirrors data into `web/data/news.json` so the static bundle stays self-contained).
   - Headlines populate:
     - A live ticker marquee.
     - Category cards with counts, numbering, and outbound links.
     - Search + filter UI (client-side substring match).
   - Includes loading + error states and a hint (`python3 scraper/scraper.py`) for regenerating data.

## Prerequisites

- Python 3.9+
- pip (or another installer) for Python packages
- Any static file server (Python's built-in `http.server` is fine) to view the UI locally

## Setup

```bash
cd /home/agent/Projects/news-app
python3 -m venv .venv && source .venv/bin/activate  # optional but recommended
pip install -r requirements.txt
```

## Refreshing headlines

```bash
cd /home/agent/Projects/news-app
python scraper/scraper.py
```

- Output goes to `data/news.json` (relative path handled inside the script).
- A simple `print` log shows which category is being fetched; redirect stdout/stderr if you want persistent logs.
- Schedule via `cron`, `systemd`, or any task runner if you need automatic refreshes.

### Customizing feeds

Edit `feeds = {...}` in `scraper/scraper.py`:
- Change the Google News search query.
- Add/remove categories; the front end reads whatever keys appear in `news.json` and builds matching UI (labels + icons defined in `CATEGORY_META` inside `web/script.js`).

## Running the web client locally

```bash
cd /home/agent/Projects/news-app/web
python -m http.server 8000
```

Then browse to <http://localhost:8000>. Because `script.js` issues a relative fetch (`data/news.json`), run the server from within `web/` so the sibling `data/` folder is reachable.

## Build & deployment

### Local build artifact

```bash
npm install          # already done in the repo
npm run vercel-build # copies web/ into public/
```

- The build script lives at `scripts/build.js` and simply mirrors `web/` (including `web/data/news.json`) into a throwaway `public/` directory.
- `public/` is git-ignored; it only exists so hosting platforms expecting a single output directory (like Vercel) can pick up static assets.

### Vercel

- Project: [`nkaringas-projects/the-brief`](https://vercel.com/nkaringas-projects/the-brief)
- Build command: `npm run vercel-build`
- Output directory: `public`
- GitHub integration: `Nkaringa/The-Brief` (push to `main` → deploy)
- Manual trigger (if needed):
  ```bash
  vercel deploy --prod --yes
  ```

Latest production deployment: https://the-brief-ppzstfb4i-nkaringas-projects.vercel.app

### Front-end features worth knowing

- **Ticker** duplicates its content for a seamless scroll and pauses on hover.
- **Filter pills** are generated dynamically from the JSON categories; the active state animates card transitions.
- **Search** applies instant substring filtering within each card without blowing away category context.
- **Error handling** shows a 503-style panel when the JSON is missing or malformed.
- **Accessibility/safety** tricks: HTML escaping, URL validation, Content Security Policy, `rel="noopener"` on links.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Empty page / 503 block | `data/news.json` missing or invalid JSON | Re-run `python scraper/scraper.py` and ensure the server has read access to `data/`. |
| Ticker/cards show stale data | Scraper not run recently | Automate the scraper or run it manually before serving the UI. |
| New category doesnt show an icon | `CATEGORY_META` lacks a mapping | Add the category + icon/label in `web/script.js`. |
| Links open unsafe protocols | `safeUrl` guards against non-http(s) links; ensure feeds return valid URLs. |

## Next steps / ideas

- Automate scraper execution (cron, GitHub Actions artifact, etc.).
- Persist history for trend charts.
- Add Telegram bot hooks using `telegram_config.json` (currently absent) if chat delivery is needed.
- Deploy the static site + JSON to a CDN / S3 bucket with a serverless refresh job.

Thats everything the current codebase supports. Run the scraper, host the `web/` folder, and The Brief is live.

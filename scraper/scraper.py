import feedparser
import json
from datetime import datetime
import os

feeds = {
    "tech": "https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en",
    "stocks": "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en",
    "war": "https://news.google.com/rss/search?q=war&hl=en-US&gl=US&ceid=US:en",
"crypto": "https://news.google.com/rss/search?q=crypto-currency&hl=en-US&gl=US&ceid=US:en",
"cyber": "https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=US&ceid=US:en"
}

news_data = {}

for category, url in feeds.items():
    print(f"Fetching {category} news...")
    feed = feedparser.parse(url)

    news_data[category] = []

    for entry in feed.entries[:10]:
        news_data[category].append({
            "title": entry.title,
            "link": entry.link
        })

output = {
    "date": str(datetime.now()),
    "news": news_data
}

# Correct path handling
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATHS = [
    os.path.join(BASE_DIR, "../data/news.json"),
    os.path.join(BASE_DIR, "../web/data/news.json"),
]

serialized = json.dumps(output, indent=2)

for path in OUTPUT_PATHS:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w") as f:
        f.write(serialized)

print("News updated successfully.")


# ─── MARKET SNAPSHOT ──────────────────────────────────────────

MARKET_SYMBOLS = [
    {"symbol": "SPY",  "name": "S&P 500"},
    {"symbol": "QQQ",  "name": "Nasdaq 100"},
    {"symbol": "DIA",  "name": "Dow Jones"},
    {"symbol": "IWM",  "name": "Russell 2000"},
    {"symbol": "GLD",  "name": "Gold"},
    {"symbol": "AAPL", "name": "Apple"},
    {"symbol": "MSFT", "name": "Microsoft"},
    {"symbol": "NVDA", "name": "NVIDIA"},
    {"symbol": "TSLA", "name": "Tesla"},
    {"symbol": "AMZN", "name": "Amazon"},
]

MARKET_OUTPUT_PATHS = [
    os.path.join(BASE_DIR, "../data/markets.json"),
    os.path.join(BASE_DIR, "../web/data/markets.json"),
]

try:
    import yfinance as yf

    print("Fetching market snapshot...")
    symbols_str = " ".join(s["symbol"] for s in MARKET_SYMBOLS)
    tickers = yf.Tickers(symbols_str)

    market_symbols = []
    for item in MARKET_SYMBOLS:
        try:
            info = tickers.tickers[item["symbol"]].fast_info
            price      = round(float(info.last_price), 2)
            prev_close = round(float(info.previous_close), 2)
            change     = round(price - prev_close, 2)
            change_pct = round((change / prev_close) * 100, 2) if prev_close else 0.0
            market_symbols.append({
                "symbol":     item["symbol"],
                "name":       item["name"],
                "price":      price,
                "change":     change,
                "change_pct": change_pct,
            })
            print(f"  {item['symbol']}: ${price} ({change_pct:+.2f}%)")
        except Exception as e:
            print(f"  Warning: could not fetch {item['symbol']}: {e}")

    if market_symbols:
        market_output = {
            "updated": str(datetime.now()),
            "symbols": market_symbols,
        }
        market_serialized = json.dumps(market_output, indent=2)
        for path in MARKET_OUTPUT_PATHS:
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            with open(path, "w") as f:
                f.write(market_serialized)
        print("Market snapshot updated successfully.")
    else:
        print("No market data fetched; leaving existing markets.json unchanged.")

except ImportError:
    print("yfinance not available; skipping market snapshot update.")
except Exception as e:
    print(f"Market snapshot failed: {e}; leaving existing markets.json unchanged.")

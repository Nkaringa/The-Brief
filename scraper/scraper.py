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
DATA_PATH = os.path.join(BASE_DIR, "../data/news.json")

with open(DATA_PATH, "w") as f:
    json.dump(output, f, indent=2)

print("News updated successfully.")

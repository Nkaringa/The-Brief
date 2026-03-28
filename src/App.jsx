import { useState, useEffect } from 'react';
import NewsTicker from './components/NewsTicker';
import MarketTicker from './components/MarketTicker';
import Header from './components/Header';
import FilterNav from './components/FilterNav';
import NewsGrid from './components/NewsGrid';
import Footer from './components/Footer';

export default function App() {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/news')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data || typeof data.news !== 'object' || data.news === null) {
          throw new Error('Invalid data structure');
        }
        setNewsData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const categories = newsData ? Object.keys(newsData.news) : [];

  return (
    <>
      <NewsTicker newsData={newsData?.news} />
      <MarketTicker />
      <Header date={newsData?.date} />
      <FilterNav
        categories={categories}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
      />
      <main>
        <NewsGrid
          newsData={newsData?.news}
          loading={loading}
          error={error}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
        />
      </main>
      <Footer date={newsData?.date} />
    </>
  );
}

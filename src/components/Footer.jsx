import { useState, useEffect } from 'react';

const DISPLAY_TZ = 'America/Indiana/Indianapolis';

function formatTime(date) {
  return date.toLocaleString('en-US', {
    timeZone: DISPLAY_TZ,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

export default function Footer({ date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updatedTime = date ? formatTime(new Date(date)) : '—';

  return (
    <footer>
      <div className="footer-inner">
        <span className="footer-brand">THE BRIEF</span>
        <div className="footer-meta" aria-label="News timing information">
          <div className="footer-meta-row">
            <span className="footer-meta-label">Time:</span>
            <span className="footer-meta-value" id="footer-time">{formatTime(now)}</span>
          </div>
          <div className="footer-meta-row">
            <span className="footer-meta-label">Last updated:</span>
            <span className="footer-meta-value" id="footer-time-updated">{updatedTime}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

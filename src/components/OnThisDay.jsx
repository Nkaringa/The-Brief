import { useState, useEffect } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function OnThisDay() {
  const [fact, setFact] = useState(null);

  useEffect(() => {
    fetch('/api/onthisday')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.text && data.year) setFact(data);
      })
      .catch(() => {});
  }, []);

  if (!fact) return null;

  const dateLabel = `${MONTHS[(fact.month || 1) - 1]} ${fact.day}`;

  return (
    <div className="onthisday" aria-label="On this day in history">
      <span className="onthisday-label">On this day</span>
      <span className="onthisday-date">{dateLabel}</span>
      <span className="onthisday-text">
        <span className="onthisday-year">{fact.year}</span>
        {fact.text}
      </span>
    </div>
  );
}

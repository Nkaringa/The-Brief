// Google News titles are formatted "Headline - Source". Split the source off
// so it can be shown as an editorial byline instead of trailing the headline.
export function parseHeadline(title) {
  const idx = title.lastIndexOf(' - ');
  if (idx > 0 && title.length - idx <= 45) {
    return { headline: title.slice(0, idx).trim(), source: title.slice(idx + 3).trim() };
  }
  return { headline: title, source: null };
}

export function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
  } catch {
    return '#';
  }
}

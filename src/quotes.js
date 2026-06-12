// A small curated set in the spirit of "The Brief — Intelligence · Curated Daily".
// Rotated deterministically by day, so it's stable for a given date with no API call.
export const QUOTES = [
  { text: 'The price of liberty is eternal vigilance.', author: 'Thomas Jefferson' },
  { text: 'Whoever controls the media controls the mind.', author: 'Jim Morrison' },
  { text: 'The first draft of history is journalism.', author: 'Alan Barth' },
  { text: 'Get your facts first, then you can distort them as you please.', author: 'Mark Twain' },
  { text: 'To be persuasive we must be believable; to be believable we must be credible; to be credible we must be truthful.', author: 'Edward R. Murrow' },
  { text: 'The truth does not change according to our ability to stomach it.', author: 'Flannery O’Connor' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The market can stay irrational longer than you can stay solvent.', author: 'John Maynard Keynes' },
  { text: 'In the midst of chaos, there is also opportunity.', author: 'Sun Tzu' },
  { text: 'It is the mark of an educated mind to entertain a thought without accepting it.', author: 'Aristotle' },
  { text: 'The function of the press is to inform, but its role is to make men free.', author: 'Wendell Phillips' },
  { text: 'Facts are stubborn things.', author: 'John Adams' },
  { text: 'A wise man proportions his belief to the evidence.', author: 'David Hume' },
  { text: 'History never repeats itself, but it does often rhyme.', author: 'Mark Twain' },
  { text: 'The most important thing in communication is hearing what isn’t said.', author: 'Peter Drucker' },
  { text: 'Predicting rain doesn’t count. Building arks does.', author: 'Warren Buffett' },
];

// Day-of-year index → a stable quote per calendar day.
export function quoteOfTheDay(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((today - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// Display metadata for the curated news categories.
// Unknown categories (e.g. ad-hoc topic searches) fall back gracefully below.
export const CATEGORY_META = {
  tech:   { icon: '⚡', label: 'Technology' },
  stocks: { icon: '📈', label: 'Markets' },
  war:    { icon: '🌐', label: 'World' },
  crypto: { icon: '₿',  label: 'Crypto' },
  cyber:  { icon: '🔒', label: 'Cybersecurity' },
};

// Label for a category; unknown categories fall back to their uppercased key.
export function categoryLabel(cat) {
  return CATEGORY_META[cat]?.label ?? cat.toUpperCase();
}

// Full meta (icon + label) for a category; unknown categories get a generic icon.
export function categoryMeta(cat) {
  return CATEGORY_META[cat] ?? { icon: '📰', label: cat };
}

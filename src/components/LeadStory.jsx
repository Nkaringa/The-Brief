import { parseHeadline, safeUrl } from '../util';
import { categoryLabel } from '../categories';

// The dominant front-page story, pulled from the lead section.
export default function LeadStory({ story, section }) {
  const { headline, source } = parseHeadline(story.title);
  return (
    <a className="lead-story" href={safeUrl(story.link)} target="_blank" rel="noopener noreferrer">
      <span className="lead-eyebrow">{categoryLabel(section)} · Lead</span>
      <h2 className="lead-headline">{headline}</h2>
      {source && <span className="lead-source">{source}</span>}
    </a>
  );
}

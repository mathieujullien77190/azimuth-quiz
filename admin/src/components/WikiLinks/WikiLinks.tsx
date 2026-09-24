import { wikiUrl } from './helpers';

export const WikiLinks = ({ wikiFr, wikiEn }: { wikiFr?: string; wikiEn?: string }) => {
  if (!wikiFr && !wikiEn) return <span className="wiki-empty">—</span>;
  return (
    <div className="wiki-links">
      {wikiFr && (
        <a className="wiki-link" href={wikiUrl('fr', wikiFr)} target="_blank" rel="noopener noreferrer">
          FR
        </a>
      )}
      {wikiEn && (
        <a className="wiki-link" href={wikiUrl('en', wikiEn)} target="_blank" rel="noopener noreferrer">
          EN
        </a>
      )}
    </div>
  );
};

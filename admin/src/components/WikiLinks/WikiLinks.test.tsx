import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { wikiUrl } from './helpers';
import { WikiLinks } from './WikiLinks';

describe('wikiUrl', () => {
  it('replaces spaces and encodes the slug', () => {
    expect(wikiUrl('fr', 'New York é')).toBe('https://fr.wikipedia.org/wiki/New_York_%C3%A9');
  });
});

describe('WikiLinks', () => {
  it('shows a dash without any link', () => {
    render(<WikiLinks />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows both links', () => {
    render(<WikiLinks wikiFr="Paris" wikiEn="Paris_en" />);
    expect(screen.getByRole('link', { name: 'FR' })).toHaveAttribute('href', 'https://fr.wikipedia.org/wiki/Paris');
    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Paris_en');
  });

  it('shows only the available language', () => {
    const { rerender } = render(<WikiLinks wikiFr="Paris" />);
    expect(screen.queryByRole('link', { name: 'EN' })).toBeNull();
    rerender(<WikiLinks wikiEn="Paris" />);
    expect(screen.queryByRole('link', { name: 'FR' })).toBeNull();
    expect(screen.getByRole('link', { name: 'EN' })).toBeInTheDocument();
  });
});

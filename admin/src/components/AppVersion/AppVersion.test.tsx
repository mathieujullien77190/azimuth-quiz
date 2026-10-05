import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import appConfig from '../../../../app.json';

import { AppVersion } from './AppVersion';

describe('AppVersion', () => {
  it('shows the version with its animal, the name linking to its English Wikipedia article', () => {
    const { container } = render(<AppVersion />);
    const { version, extra } = appConfig.expo;
    expect(container.textContent).toBe(`v${version} - ${extra.codename.emoji} - ${extra.codename.name}`);
    const link = screen.getByRole('link', { name: extra.codename.name });
    expect(link.getAttribute('href')).toBe(extra.codename.wiki);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});

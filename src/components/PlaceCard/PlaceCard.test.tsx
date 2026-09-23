import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { Place } from '@/types';

import PlaceCard from '.';

const place: Place = {
  name: 'Paris',
  code: 'FR',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  category: 'cities',
  difficulty: 'easy',
  wikiFr: 'Paris',
  wikiEn: 'Paris',
};

describe('PlaceCard', () => {
  it('renders the place name and category emoji, without country when showCountry is false', async () => {
    const { getByText, queryByText } = await render(<PlaceCard place={place} showCountry={false} />);
    expect(getByText('Paris')).toBeTruthy();
    expect(queryByText(/France/)).toBeNull();
  });

  it('renders the country name when showCountry is true', async () => {
    const { getByText } = await render(<PlaceCard place={place} showCountry={true} />);
    expect(getByText(/France/)).toBeTruthy();
  });

  it('does not render a description or wiki link before revelation (description undefined)', async () => {
    const { queryByRole } = await render(<PlaceCard place={place} showCountry={false} />);
    expect(queryByRole('link')).toBeNull();
  });

  it('renders the description (French) and a wiki link once revealed', async () => {
    const { getByText, getByRole } = await render(
      <PlaceCard description="Ville lumiere." place={place} showCountry={false} />,
    );
    expect(getByText('Ville lumiere.')).toBeTruthy();
    const link = getByRole('link');
    expect(link).toBeTruthy();
  });

  it('opens the wiki URL on press', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const { getByRole } = await render(<PlaceCard description="desc" place={place} showCountry={false} />);
    await fireEvent.press(getByRole('link'));
    expect(openURL).toHaveBeenCalledWith('https://fr.wikipedia.org/wiki/Paris');
    openURL.mockRestore();
  });

  it('does not render a wiki link when revealed but no slug is set at all', async () => {
    const bare: Place = { ...place, wikiFr: undefined, wikiEn: undefined };
    const { queryByRole } = await render(<PlaceCard description="desc" place={bare} showCountry={false} />);
    expect(queryByRole('link')).toBeNull();
  });
});

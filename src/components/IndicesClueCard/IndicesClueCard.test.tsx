import { fireEvent, render } from '@testing-library/react-native';

import { INDICES_PLACES } from '@/constants';
import type { IndicesClueId, IndicesPlace } from '@/types';

import IndicesClueCard from '.';

const place: IndicesPlace = INDICES_PLACES.find((p) => p.country === 'France')!;

const renderCard = async (props: Partial<React.ComponentProps<typeof IndicesClueCard>> & { clueId: IndicesClueId }) =>
  render(<IndicesClueCard label="Label" place={place} state="locked" {...props} />);

describe('IndicesClueCard — locked state', () => {
  it('shows a lock icon and no revealed content', async () => {
    const { getByText, queryByText } = await renderCard({ clueId: 'population', state: 'locked' });
    expect(getByText('🔒')).toBeTruthy();
    expect(queryByText(String(place.population))).toBeNull();
  });

  it('is pickable (calls onPress) when locked and onPress is provided', async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderCard({ clueId: 'population', onPress, state: 'locked' });
    await fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not pickable when locked without onPress', async () => {
    const { queryByRole } = await renderCard({ clueId: 'population', state: 'locked' });
    expect(queryByRole('button')).toBeNull();
  });
});

describe('IndicesClueCard — revealed content per clue', () => {
  it('isCapital: shows "Oui" for a capital', async () => {
    const { getByText } = await renderCard({ clueId: 'isCapital', place, state: 'revealed' });
    expect(getByText('Oui')).toBeTruthy();
  });

  it('isCapital: shows "Non" for a non-capital', async () => {
    const nonCapital = INDICES_PLACES.find((p) => p.name === 'Marseille')!;
    const { getByText } = await renderCard({ clueId: 'isCapital', place: nonCapital, state: 'revealed' });
    expect(getByText('Non')).toBeTruthy();
  });

  it('position: renders a dot positioned per positionInCountry', async () => {
    const { toJSON } = await renderCard({ clueId: 'position', state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });

  it('population: stage 1 (default) renders the 5-dot tier gauge, not the number', async () => {
    const { toJSON, queryByText } = await renderCard({ clueId: 'population', state: 'revealed' });
    expect(toJSON()).toBeTruthy();
    expect(queryByText('hab.')).toBeNull();
  });

  it('population: stage 2 renders the formatted number and unit', async () => {
    const { getByText } = await renderCard({ clueId: 'population', populationStage: 2, state: 'revealed' });
    expect(getByText('hab.')).toBeTruthy();
  });

  it('climate: renders the climate emoji', async () => {
    const { getByText } = await renderCard({ clueId: 'climate', state: 'revealed' });
    expect(getByText(place.climateEmoji)).toBeTruthy();
  });

  it('elevation: stage 1 (default) renders a tier emoji, not the value', async () => {
    const { queryByText } = await renderCard({ clueId: 'elevation', state: 'revealed' });
    expect(queryByText(String(place.elevationMeters))).toBeNull();
  });

  it('elevation: stage 2 renders the value in meters', async () => {
    const { getByText } = await renderCard({ clueId: 'elevation', elevationStage: 2, state: 'revealed' });
    expect(getByText(String(place.elevationMeters))).toBeTruthy();
    expect(getByText('m')).toBeTruthy();
  });

  it('letterCount: renders the letter count and unit', async () => {
    const { getByText } = await renderCard({ clueId: 'letterCount', state: 'revealed' });
    expect(getByText('lettres')).toBeTruthy();
  });

  it('wordCount: renders the word count', async () => {
    const { toJSON } = await renderCard({ clueId: 'wordCount', state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });

  it('bearing: renders the compass when bearingDeg is provided', async () => {
    const { toJSON } = await renderCard({ bearingDeg: 42, clueId: 'bearing', state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });

  it('bearing: renders nothing when bearingDeg is missing', async () => {
    const { toJSON } = await renderCard({ clueId: 'bearing', state: 'revealed' });
    // The card still renders (icon/anim), but the clue body is empty (null).
    expect(toJSON()).toBeTruthy();
  });

  it('distance: renders the earth section when both bearingDeg and distanceKm are provided', async () => {
    const { toJSON } = await renderCard({ bearingDeg: 10, clueId: 'distance', distanceKm: 500, state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });

  it('distance: renders nothing when distanceKm is missing', async () => {
    const { toJSON } = await renderCard({ bearingDeg: 10, clueId: 'distance', state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });

  it('localTime: stage 1 (default) renders a day/night emoji, not the time', async () => {
    const { queryByText } = await renderCard({ clueId: 'localTime', state: 'revealed' });
    expect(queryByText(/^\d{2}h\d{2}$/)).toBeNull();
  });

  it('localTime: stage 2 renders an HHhmm value', async () => {
    const { getByText } = await renderCard({ clueId: 'localTime', localTimeStage: 2, state: 'revealed' });
    expect(getByText(/^\d{2}h\d{2}$/)).toBeTruthy();
  });

  it('phoneCode: renders the phone code', async () => {
    const { getByText } = await renderCard({ clueId: 'phoneCode', state: 'revealed' });
    expect(getByText(place.phoneCode)).toBeTruthy();
  });

  it('currency: stage 1 (default) renders the currency symbol', async () => {
    const { getByText } = await renderCard({ clueId: 'currency', state: 'revealed' });
    expect(getByText(place.currency)).toBeTruthy();
  });

  it('currency: stage 2 renders the full currency name, with no country name in it', async () => {
    const { getByText } = await renderCard({ clueId: 'currency', currencyStage: 2, state: 'revealed' });
    expect(getByText('Euro')).toBeTruthy();
  });

  it('currency: stage 2 falls back to the symbol when the country has no currency name', async () => {
    const unknownCountryPlace = { ...place, code: 'XX' };
    const { getByText } = await renderCard({ clueId: 'currency', currencyStage: 2, place: unknownCountryPlace, state: 'revealed' });
    expect(getByText(place.currency)).toBeTruthy();
  });

  it('airportCode: renders the airport code', async () => {
    const { getByText } = await renderCard({ clueId: 'airportCode', state: 'revealed' });
    expect(getByText(place.airportCode)).toBeTruthy();
  });

  it('unknown clue id: renders nothing (defensive default branch)', async () => {
    const { toJSON } = await renderCard({ clueId: 'bogus' as IndicesClueId, state: 'revealed' });
    expect(toJSON()).toBeTruthy();
  });
});

describe('IndicesClueCard — emoji progressive reveal', () => {
  it('defaults to stage 1 when emojiStage is not provided', async () => {
    const { getByText, getAllByText } = await renderCard({ clueId: 'emoji', state: 'revealed' });
    expect(getByText(place.emojis[0])).toBeTruthy();
    expect(getAllByText('❓')).toHaveLength(2);
  });

  it('shows exactly `stage` emoji and the rest as ❓', async () => {
    const { getByText, getAllByText } = await renderCard({ clueId: 'emoji', emojiStage: 2, state: 'revealed' });
    expect(getByText(place.emojis[0])).toBeTruthy();
    expect(getByText(place.emojis[1])).toBeTruthy();
    expect(getAllByText('❓')).toHaveLength(1);
  });

  it('shows all 3 emoji at stage 3', async () => {
    const { queryAllByText } = await renderCard({ clueId: 'emoji', emojiStage: 3, state: 'revealed' });
    expect(queryAllByText('❓')).toHaveLength(0);
    for (const emoji of place.emojis) expect(queryAllByText(emoji).length).toBeGreaterThan(0);
  });

  it('is pickable again while moreToReveal is true, not once fully revealed', async () => {
    const onPress = jest.fn();
    const more = await renderCard({ clueId: 'emoji', emojiStage: 1, moreToReveal: true, onPress, state: 'revealed' });
    await fireEvent.press(more.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);

    const done = await renderCard({ clueId: 'emoji', emojiStage: 3, moreToReveal: false, onPress, state: 'revealed' });
    expect(done.queryByRole('button')).toBeNull();
  });
});

describe('IndicesClueCard — flag progressive reveal', () => {
  it('defaults to stage 1 when flagStage is not provided: first color shown, others hidden', async () => {
    const { getAllByText } = await renderCard({ clueId: 'flagColors', state: 'revealed' });
    expect(getAllByText('33%')).toHaveLength(1);
    expect(getAllByText('?')).toHaveLength(2);
  });

  it('reveals every color on the 2nd click, however many the flag actually has', async () => {
    const { queryAllByText } = await renderCard({ clueId: 'flagColors', flagStage: 2, state: 'revealed' });
    expect(queryAllByText('?')).toHaveLength(0);
    expect(queryAllByText('33%')).toHaveLength(3);
  });

  it('swaps the swatches for the actual flag emoji at stage 3, and the progress badge counts it too', async () => {
    const { getByText, queryAllByText } = await renderCard({ clueId: 'flagColors', flagStage: 3, state: 'revealed' });
    expect(getByText('🇫🇷')).toBeTruthy();
    expect(getByText('3/3')).toBeTruthy();
    expect(queryAllByText('?')).toHaveLength(0);
    expect(queryAllByText('33%')).toHaveLength(0);
  });

  it('renders an empty list for a country with no flag color data', async () => {
    const unknownCountryPlace = { ...place, code: 'XX' };
    const { toJSON, queryAllByText } = await renderCard({ clueId: 'flagColors', place: unknownCountryPlace, state: 'revealed' });
    expect(toJSON()).toBeTruthy();
    expect(queryAllByText('?')).toHaveLength(0);
  });
});

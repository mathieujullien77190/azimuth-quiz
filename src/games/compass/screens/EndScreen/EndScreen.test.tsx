import { fireEvent, render } from '@testing-library/react-native';

import { formatNumber } from '@/helpers';
import type { Place, Player, PlayerResult, RoundRecord } from '@/types';

import EndScreen from '.';

const place = (name: string, code: string): Place => ({
  name,
  code,
  coordinates: { latitude: 0, longitude: 0 },
  category: 'cities',
  difficulty: 'easy',
});

const result = (directionPoints: number, distancePoints: number): PlayerResult => ({
  guess: { bearing: 0, distanceKm: 0 },
  score: {
    trueBearing: 0,
    trueSurfaceDistanceKm: 0,
    directionError: 0,
    distanceError: 0,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    directionExactBonus: 0,
    distanceExactBonus: 0,
    total: directionPoints + distancePoints,
  },
});

const alice: Player = { name: 'Alice', color: '#EF4444' };
const bob: Player = { name: 'Bob', color: '#16A34A' };

describe('EndScreen — alone', () => {
  const records: RoundRecord[] = [{ place: place('Paris', 'FR'), results: [result(400, 350)] }];

  it('shows the rank title and the score, and the points won on each criterion per round', async () => {
    const { getByText, getAllByText, queryByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice]} records={records} totals={[900]} />,
    );
    expect(getByText('Classement final')).toBeTruthy();
    expect(getByText(formatNumber(900))).toBeTruthy();
    expect(getByText('Paris')).toBeTruthy();
    expect(getByText('+400')).toBeTruthy();
    expect(getByText('+350')).toBeTruthy();
    // Alone, "the best" is always you: the recap names nobody (only the ranking lists Alice), no banner.
    expect(getAllByText('Alice')).toHaveLength(1);
    expect(queryByText(/gagne/)).toBeNull();
  });

  it('defaults the score to 0 when totals is empty', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice]} records={records} totals={[]} />,
    );
    expect(getByText(formatNumber(0))).toBeTruthy();
  });

  it('goes home', async () => {
    const onMenu = jest.fn();
    const { getByText } = await render(
      <EndScreen onMenu={onMenu} players={[alice]} records={records} totals={[900]} />,
    );
    await fireEvent.press(getByText('Accueil'));
    expect(onMenu).toHaveBeenCalledTimes(1);
  });
});

describe('EndScreen — several players', () => {
  const records: RoundRecord[] = [
    // Paris: Alice best on direction, Bob best on distance.
    { place: place('Paris', 'FR'), results: [result(400, 100), result(200, 300)] },
    // Berlin: a tie on direction, nobody scored on distance.
    { place: place('Berlin', 'DE'), results: [result(250, 0), result(250, 0)] },
  ];

  it('announces the winner and lists the totals with medals', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice, bob]} records={records} totals={[600, 800]} />,
    );
    expect(getByText('Bob gagne !')).toBeTruthy();
    expect(getByText(`${formatNumber(800)} pts`)).toBeTruthy();
    expect(getByText('🥇')).toBeTruthy();
    expect(getByText('🥈')).toBeTruthy();
  });

  it('shows, round by round, who was best at the heading and at the distance', async () => {
    const { getAllByText, getByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice, bob]} records={records} totals={[600, 800]} />,
    );
    expect(getByText('Manche par manche')).toBeTruthy();
    expect(getByText('Direction')).toBeTruthy();
    expect(getByText('Distance')).toBeTruthy();
    // Paris
    expect(getByText('+400')).toBeTruthy();
    expect(getByText('+300')).toBeTruthy();
    // Berlin: both share the direction, nobody has a distance
    expect(getByText('Alice, Bob')).toBeTruthy();
    expect(getByText('+250')).toBeTruthy();
    expect(getAllByText('–')).toHaveLength(1);
  });

  it('shows a tie as such', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice, bob]} records={records} totals={[800, 800]} />,
    );
    expect(getByText('Égalité : Alice et Bob')).toBeTruthy();
  });

  it('copes with a round that has more results than the players left', async () => {
    // Three results, two players left: the third one (best on both) has quit.
    const withLeaver: RoundRecord[] = [
      { place: place('Paris', 'FR'), results: [result(100, 100), result(200, 200), result(900, 900)] },
    ];
    const { getAllByText, queryByText } = await render(
      <EndScreen onMenu={jest.fn()} players={[alice, bob]} records={withLeaver} totals={[100, 200]} />,
    );
    expect(getAllByText('Bob')).toHaveLength(3);
    expect(getAllByText('+200').length).toBeGreaterThan(0);
    expect(queryByText('+900')).toBeNull();
  });
});

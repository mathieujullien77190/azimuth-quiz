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

const result = (total: number): PlayerResult => ({
  guess: { bearing: 0, distanceKm: 0, inclination: 0 },
  score: {
    trueBearing: 0,
    trueInclination: 0,
    trueSurfaceDistanceKm: 0,
    trueStraightDistanceKm: 0,
    directionError: 0,
    distanceError: 0,
    directionPoints: 0,
    distancePoints: 0,
    directionBonus: 0,
    distanceBonus: 0,
    total,
  },
});

describe('EndScreen — solo', () => {
  const alice: Player = { name: 'Alice', color: '#EF4444' };
  const records: RoundRecord[] = [{ place: place('Paris', 'FR'), results: [result(900)] }];

  it('shows the rank hero and score, not the multiplayer ranking card', async () => {
    const { getByText, queryByText } = await render(
      <EndScreen onMenu={jest.fn()} onReplay={jest.fn()} players={[alice]} records={records} totals={[900]} />,
    );
    expect(getByText(formatNumber(900))).toBeTruthy();
    // Detail de manche solo : nom du pays, pas "Meilleur : ..."
    expect(queryByText(/Meilleur/)).toBeNull();
  });

  it('defaults the score to 0 when totals is empty', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} onReplay={jest.fn()} players={[alice]} records={records} totals={[]} />,
    );
    expect(getByText(formatNumber(0))).toBeTruthy();
  });

  it('calls onReplay and onMenu', async () => {
    const onReplay = jest.fn();
    const onMenu = jest.fn();
    const { getByText } = await render(
      <EndScreen onMenu={onMenu} onReplay={onReplay} players={[alice]} records={records} totals={[900]} />,
    );
    await fireEvent.press(getByText('Rejouer'));
    await fireEvent.press(getByText('Accueil'));
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
  });
});

describe('EndScreen — multiplayer', () => {
  const alice: Player = { name: 'Alice', color: '#EF4444' };
  const bob: Player = { name: 'Bob', color: '#16A34A' };
  const records: RoundRecord[] = [
    { place: place('Paris', 'FR'), results: [result(300), result(500)] },
    { place: place('Berlin', 'DE'), results: [result(300), result(300)] },
  ];

  it('shows the winner title, ranking rows with medals, and per-round best', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} onReplay={jest.fn()} players={[alice, bob]} records={records} totals={[600, 800]} />,
    );
    expect(getByText('Bob gagne !')).toBeTruthy();
    expect(getByText(formatNumber(800))).toBeTruthy();
    expect(getByText(formatNumber(600))).toBeTruthy();
    // Manche 1 : Bob gagne (500 > 300).
    expect(getByText('Meilleur : Bob')).toBeTruthy();
    // Manche 2 : egalite -> premier joueur (Alice) gagne par convention.
    expect(getByText('Meilleur : Alice')).toBeTruthy();
  });

  it('shows a tie title when several players share the top rank', async () => {
    const { getByText } = await render(
      <EndScreen onMenu={jest.fn()} onReplay={jest.fn()} players={[alice, bob]} records={records} totals={[800, 800]} />,
    );
    expect(getByText('Égalité : Alice et Bob')).toBeTruthy();
  });

  it('shows medals for the top 3 and none for 4th place and beyond', async () => {
    const cid: Player = { name: 'Cid', color: '#0891B2' };
    const dee: Player = { name: 'Dee', color: '#2563EB' };
    const { getByText, getAllByText } = await render(
      <EndScreen
        onMenu={jest.fn()}
        onReplay={jest.fn()}
        players={[alice, bob, cid, dee]}
        records={records}
        totals={[400, 300, 200, 100]}
      />,
    );
    expect(getAllByText('🥇')).toHaveLength(1);
    expect(getAllByText('🥈')).toHaveLength(1);
    expect(getAllByText('🥉')).toHaveLength(1);
    expect(getByText('Dee')).toBeTruthy();
  });
});

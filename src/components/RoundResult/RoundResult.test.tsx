import { fireEvent, render } from '@testing-library/react-native';
import * as RN from 'react-native';

import type { Place, Player, RoundRecord } from '@/types';

import RoundResult from '.';

const place: Place = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
};

const scoreFixture = {
  trueBearing: 90,
  trueInclination: 30,
  trueSurfaceDistanceKm: 1000,
  trueStraightDistanceKm: 900,
  directionError: 10,
  distanceError: 0.1,
  directionPoints: 400,
  distancePoints: 350,
  directionBonus: 100,
  distanceBonus: 0,
  total: 850,
};

const soloRecord: RoundRecord = {
  place,
  results: [
    {
      guess: { bearing: 80, distanceKm: 950, inclination: 25 },
      score: scoreFixture,
    },
  ],
};

const soloPlayers: Player[] = [{ name: 'Zoé', color: '#EF4444' }];

const multiRecord: RoundRecord = {
  place,
  results: [
    // Zoé : score le plus bas -> classee en second malgre l'ordre des joueurs.
    { guess: { bearing: 80, distanceKm: 950, inclination: 25 }, score: { ...scoreFixture, total: 500 } },
    // Max : meilleur score de la manche -> classe en premier.
    { guess: { bearing: 95, distanceKm: 1010, inclination: 32 }, score: { ...scoreFixture, total: 900, distanceBonus: 100 } },
  ],
};

const multiPlayers: Player[] = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

describe('RoundResult — solo', () => {
  it('shows "Ton score" instead of the player name, and the truth row values', async () => {
    const { getByText } = await render(
      <RoundResult options={{ straightLine: false }} players={soloPlayers} record={soloRecord} totals={[850]} />,
    );
    expect(getByText('Ton score')).toBeTruthy();
    expect(getByText('+850')).toBeTruthy();
  });

  it('does not show the inclination row when straightLine is off', async () => {
    const { queryByText } = await render(
      <RoundResult options={{ straightLine: false }} players={soloPlayers} record={soloRecord} totals={[850]} />,
    );
    expect(queryByText('Inclinaison')).toBeNull();
  });

  it('shows inclination rows (truth and player) when straightLine is on', async () => {
    const { getAllByText } = await render(
      <RoundResult options={{ straightLine: true }} players={soloPlayers} record={soloRecord} totals={[850]} />,
    );
    // Une pour la verite, une pour le joueur.
    expect(getAllByText('Inclinaison')).toHaveLength(2);
  });

  it('toggles the scoring explanation text on press', async () => {
    const { getByText, queryByText } = await render(
      <RoundResult options={{ straightLine: false }} players={soloPlayers} record={soloRecord} totals={[850]} />,
    );
    expect(queryByText(/Cap et distance rapportent/)).toBeNull();
    await fireEvent.press(getByText('Comment les points sont calculés'));
    expect(getByText(/Cap et distance rapportent/)).toBeTruthy();
    await fireEvent.press(getByText('Comment les points sont calculés'));
    expect(queryByText(/Cap et distance rapportent/)).toBeNull();
  });
});

describe('RoundResult — multiplayer', () => {
  it('ranks players by round score, best first, and shows both names/dots', async () => {
    const { getAllByText } = await render(
      <RoundResult options={{ straightLine: false }} players={multiPlayers} record={multiRecord} totals={[500, 900]} />,
    );
    const names = getAllByText(/Zoé|Max/);
    expect(names[0].props.children).toBe('Max');
    expect(names[1].props.children).toBe('Zoé');
  });

  it('renders the compact layout under the compact breakpoint', async () => {
    const spy = jest.spyOn(RN, 'useWindowDimensions').mockReturnValue({ width: 300, height: 600, scale: 2, fontScale: 1 });
    const { getByText } = await render(
      <RoundResult options={{ straightLine: false }} players={multiPlayers} record={multiRecord} totals={[500, 900]} />,
    );
    expect(getByText('Max')).toBeTruthy();
    spy.mockRestore();
  });
});

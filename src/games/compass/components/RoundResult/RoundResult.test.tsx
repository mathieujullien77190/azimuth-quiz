import { act, fireEvent, render } from '@testing-library/react-native';
import { Dimensions, Linking } from 'react-native';

import { formatDistance } from '@/helpers';
import type { Place, Player, RoundRecord } from '@/types';

import RoundResult from '.';

// `useWindowDimensions` reads from the real `Dimensions` module (mocking the hook itself doesn't
// reach RoundResult from this file — mutating the shared Dimensions singleton does).
const originalWindow = Dimensions.get('window');
const setWindowWidth = (width: number) => act(async () => Dimensions.set({ window: { ...originalWindow, width } }));

afterEach(async () => {
  await setWindowWidth(originalWindow.width);
});

const place: Place = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
};

const scoreFixture = {
  trueBearing: 90,
  trueSurfaceDistanceKm: 1000,
  directionError: 10,
  distanceError: 0.1,
  directionPoints: 400,
  distancePoints: 350,
  directionBonus: 100,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  targetGapKm: 0,
  total: 850,
};

const soloRecord: RoundRecord = {
  place,
  results: [
    {
      guess: { bearing: 80, distanceKm: 950 },
      score: scoreFixture,
    },
  ],
};

const soloPlayers: Player[] = [{ name: 'Zoé', color: '#EF4444' }];

const multiRecord: RoundRecord = {
  place,
  results: [
    // Zoé: aimed farthest from the place -> ranked second despite player order.
    { guess: { bearing: 80, distanceKm: 950 }, score: { ...scoreFixture, total: 500, targetGapKm: 300 } },
    // Max: aimed closest to the place -> ranked first.
    {
      guess: { bearing: 95, distanceKm: 1010 },
      score: { ...scoreFixture, total: 900, distanceBonus: 100, targetGapKm: 40 },
    },
  ],
};

const multiPlayers: Player[] = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

describe('RoundResult — solo', () => {
  it('shows "Ton score" instead of the player name, and the truth row values', async () => {
    const { getByText } = await render(<RoundResult players={soloPlayers} record={soloRecord} totals={[850]} />);
    expect(getByText('Ton score')).toBeTruthy();
    expect(getByText('+850')).toBeTruthy();
  });

  it('toggles the scoring explanation text on press', async () => {
    const { getByText, queryByText } = await render(
      <RoundResult players={soloPlayers} record={soloRecord} totals={[850]} />,
    );
    expect(queryByText(/rapportent chacun/)).toBeNull();
    await fireEvent.press(getByText('Comment les points sont calculés'));
    expect(getByText(/rapportent chacun/)).toBeTruthy();
    await fireEvent.press(getByText('Comment les points sont calculés'));
    expect(queryByText(/rapportent chacun/)).toBeNull();
  });

  it('opens the rhumb-line Wikipedia page from the scoring explanation', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText } = await render(<RoundResult players={soloPlayers} record={soloRecord} totals={[850]} />);
    await fireEvent.press(getByText('Comment les points sont calculés'));
    await fireEvent.press(getByText('loxodromique'));
    expect(openURL).toHaveBeenCalledWith('https://fr.wikipedia.org/wiki/Loxodromie');
    openURL.mockRestore();
  });
});

describe('RoundResult — score bonus colouring', () => {
  it('renders the non-compact layout above the compact breakpoint', async () => {
    await setWindowWidth(800);
    const { getByText } = await render(<RoundResult players={soloPlayers} record={soloRecord} totals={[850]} />);
    expect(getByText('+850')).toBeTruthy();
  });

  it('does not highlight the direction points when there is no bonus', async () => {
    const noBonusRecord: RoundRecord = {
      place,
      results: [{ guess: { bearing: 80, distanceKm: 950 }, score: { ...scoreFixture, directionBonus: 0 } }],
    };
    const { getByText } = await render(<RoundResult players={soloPlayers} record={noBonusRecord} totals={[850]} />);
    expect(getByText('+850')).toBeTruthy();
  });

  it('shows "PERFECT" instead of the degree gap, and folds the bonus into the points, on an exact heading', async () => {
    const exactRecord: RoundRecord = {
      place,
      results: [
        {
          guess: { bearing: 90, distanceKm: 950 },
          score: { ...scoreFixture, directionBonus: 0, directionExactBonus: 100 },
        },
      ],
    };
    const { getByText, queryByText } = await render(
      <RoundResult players={soloPlayers} record={exactRecord} totals={[850]} />,
    );
    expect(getByText('PERFECT')).toBeTruthy();
    expect(queryByText('(+10°)')).toBeNull();
    expect(getByText('+500')).toBeTruthy();
  });

  it('shows "PERFECT" instead of the km gap, and folds the bonus into the points, on an exact distance', async () => {
    const exactDistanceRecord: RoundRecord = {
      place,
      results: [
        {
          guess: { bearing: 80, distanceKm: 950 },
          score: { ...scoreFixture, distanceBonus: 0, distanceExactBonus: 100, directionExactBonus: 100 },
        },
      ],
    };
    const { getAllByText, queryByText } = await render(
      <RoundResult players={soloPlayers} record={exactDistanceRecord} totals={[850]} />,
    );
    // Exact on both axes: PERFECT on the heading row and on the distance row, no km gap.
    expect(getAllByText('PERFECT')).toHaveLength(2);
    expect(queryByText(/^\(.*km\)$/)).toBeNull();
  });

  it('keeps the km gap when only the distance is exact (wrong heading means a far-off point)', async () => {
    const record: RoundRecord = {
      place,
      results: [
        {
          guess: { bearing: 80, distanceKm: 950 },
          score: { ...scoreFixture, distanceBonus: 0, distanceExactBonus: 100, directionExactBonus: 0 },
        },
      ],
    };
    const { queryByText } = await render(<RoundResult players={soloPlayers} record={record} totals={[850]} />);
    expect(queryByText('PERFECT')).toBeNull();
  });
});

describe('RoundResult — multiplayer', () => {
  it('ranks players by how close they aimed to the place, best first, and shows both names/dots', async () => {
    const { getAllByText } = await render(
      <RoundResult players={multiPlayers} record={multiRecord} totals={[500, 900]} />,
    );
    const names = getAllByText(/Zoé|Max/);
    expect(names[0].props.children).toBe('Max');
    expect(names[1].props.children).toBe('Zoé');
  });

  it('renders the compact layout under the compact breakpoint', async () => {
    await setWindowWidth(300);
    const { getByText } = await render(<RoundResult players={multiPlayers} record={multiRecord} totals={[500, 900]} />);
    expect(getByText('Max')).toBeTruthy();
  });
});

describe('RoundResult — waiting for the other players (online, pending)', () => {
  const renderPending = (answered: boolean[], localIndex?: number) =>
    render(
      <RoundResult
        answered={answered}
        localIndex={localIndex}
        players={multiPlayers}
        record={multiRecord}
        totals={[500, 900]}
      />,
    );

  it('blanks the truth row: nobody is officially scored yet', async () => {
    const pending = await renderPending([true, true]);
    expect(pending.queryByText(formatDistance(1000))).toBeNull();
    await pending.unmount();
    const scored = await render(<RoundResult players={multiPlayers} record={multiRecord} totals={[500, 900]} />);
    expect(scored.getByText(formatDistance(1000))).toBeTruthy();
  });

  it('shows "?" instead of every official points value and round total', async () => {
    const { getAllByText } = await renderPending([true, true]);
    // 2 players x (direction points + distance points + round total).
    expect(getAllByText('?')).toHaveLength(6);
  });

  it('marks an answered player with a check; a silent one shows "?" instead of their guess', async () => {
    const { getAllByText } = await renderPending([true, false]);
    expect(getAllByText('✓')).toHaveLength(1);
    // The 6 pending points/totals, plus the silent player direction and distance.
    expect(getAllByText('?')).toHaveLength(8);
  });

  it('keeps the given order instead of ranking by score, without a local index', async () => {
    const { getAllByText } = await renderPending([true, true]);
    const names = getAllByText(/Zoé|Max/);
    expect(names[0].props.children).toBe('Zoé');
    expect(names[1].props.children).toBe('Max');
  });

  it('pins this device own entry first, the others keeping their order', async () => {
    const { getAllByText } = await renderPending([true, true], 1);
    const names = getAllByText(/Zoé|Max/);
    expect(names[0].props.children).toBe('Max');
    expect(names[1].props.children).toBe('Zoé');
  });
});

describe('RoundResult — host kick button', () => {
  it('offers one "Expulser" button per other player, wired to that player index', async () => {
    const onKick = jest.fn();
    const { getAllByText } = await render(
      <RoundResult localIndex={0} onKick={onKick} players={multiPlayers} record={multiRecord} totals={[500, 900]} />,
    );
    const buttons = getAllByText('Expulser');
    expect(buttons).toHaveLength(1);
    await fireEvent.press(buttons[0]);
    expect(onKick).toHaveBeenCalledWith(1);
  });

  it('offers no button without onKick', async () => {
    const { queryByText } = await render(
      <RoundResult players={multiPlayers} record={multiRecord} totals={[500, 900]} />,
    );
    expect(queryByText('Expulser')).toBeNull();
  });
});

describe('RoundResult — a player left mid-reveal', () => {
  it('drops the results that no longer have a matching player', async () => {
    const { queryByText, getByText } = await render(
      <RoundResult
        players={[multiPlayers[0], { name: 'Eve', color: '#000000' }]}
        record={soloRecordFor(3)}
        totals={[1, 2]}
      />,
    );
    expect(getByText('Zoé')).toBeTruthy();
    expect(getByText('Eve')).toBeTruthy();
    expect(queryByText('Max')).toBeNull();
  });
});

function soloRecordFor(count: number): RoundRecord {
  return {
    place,
    results: Array.from({ length: count }, () => ({
      guess: { bearing: 80, distanceKm: 950 },
      score: scoreFixture,
    })),
  };
}

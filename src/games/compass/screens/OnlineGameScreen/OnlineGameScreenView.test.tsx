import { fireEvent, render } from '@testing-library/react-native';

import { ratioToKm } from '@/helpers';
import { translations } from '@/i18n/translations';
import type { RoundRecord } from '@/types';

import { OnlineGameScreenView } from './OnlineGameScreenView';
import type { OnlineGameScreenViewProps } from './types';

const t = translations.fr;

// The real slider is a `PanResponder` surface: a pressable stands in, reporting the middle.
jest.mock('@/components/ui/SliderTrack', () => ({
  __esModule: true,
  default: ({ onRatioChange }: { onRatioChange: (ratio: number) => void }) => {
    const { Pressable: Stand } = jest.requireActual('react-native');
    return <Stand accessibilityLabel="slider" onPress={() => onRatioChange(0.5)} />;
  },
}));

const BERLIN = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
} as const;

const record: RoundRecord = {
  place: BERLIN,
  results: [
    {
      guess: { bearing: 50, distanceKm: 900 },
      score: {
        trueBearing: 60,
        trueSurfaceDistanceKm: 880,
        directionError: 10,
        distanceError: 0.1,
        directionPoints: 400,
        distancePoints: 350,
        directionBonus: 0,
        distanceBonus: 0,
        directionExactBonus: 0,
        distanceExactBonus: 0,
        total: 750,
      },
    },
  ],
};

const baseProps: OnlineGameScreenViewProps = {
  scrollRef: { current: null },
  onQuit: jest.fn(),
  name: 'Zoé',
  points: 0,
  roomCode: 'tabofuna',
  difficulty: 'easy',
  roundNumber: 1,
  totalRounds: 2,
  place: BERLIN,
  liveCompass: false,
  earthMarks: [],
  origin: { latitude: 48.8566, longitude: 2.3522 },
  showCountry: false,
  compassColor: '#EF4444',
  bearing: 0,
  onSetBearing: jest.fn(),
  distanceKm: 1000,
  onSetDistanceKm: jest.fn(),
  maxDistanceKm: 20000,
  onCap: false,
  onScroll: jest.fn(),
  onGoToCap: jest.fn(),
  onGoToDistance: jest.fn(),
  onSubmit: jest.fn(),
  submitDisabled: false,
};

beforeEach(() => jest.clearAllMocks());

describe('OnlineGameScreenView — answering', () => {
  it('turns a slider move into a distance in km', async () => {
    const { getByLabelText } = await render(<OnlineGameScreenView {...baseProps} />);
    await fireEvent.press(getByLabelText('slider'));
    expect(baseProps.onSetDistanceKm).toHaveBeenCalledWith(ratioToKm(0.5, 20000));
  });

  it('has the slider only while answering', async () => {
    const { queryByLabelText } = await render(<OnlineGameScreenView {...baseProps} record={record} />);
    expect(queryByLabelText('slider')).toBeNull();
  });
});

describe('OnlineGameScreenView — the 3D globe', () => {
  // A far answer: the Earth is at its real scale, where the switch can show.
  const far = [{ bearing: 90, distanceKm: 20000, color: '#EF4444' }];

  it('is not offered while the players are still answering', async () => {
    const { queryByText } = await render(<OnlineGameScreenView {...baseProps} earthMarks={far} />);
    expect(queryByText('3D')).toBeNull();
  });

  it('is offered with the solution', async () => {
    const { getByText } = await render(<OnlineGameScreenView {...baseProps} earthMarks={far} record={record} />);
    expect(getByText('3D')).toBeTruthy();
  });
});

describe('OnlineGameScreenView — the round result', () => {
  it('draws the compass without extra needles when none are given, and no result table without players', async () => {
    const { queryByText } = await render(<OnlineGameScreenView {...baseProps} record={record} />);
    expect(queryByText(t.game.waitingForOthers)).toBeTruthy();
    expect(queryByText(t.roundResult.direction)).toBeNull();
  });

  it('keeps working when the host presses "next" with no handler wired', async () => {
    const { getByText } = await render(<OnlineGameScreenView {...baseProps} confirmed isHost record={record} />);
    await fireEvent.press(getByText(t.game.next));
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });
});

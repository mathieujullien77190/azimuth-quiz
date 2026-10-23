import type { Meta, StoryObj } from '@storybook/react-vite';

import type { EarthMark } from '@/components/geo/EarthSection';
import { DEFAULT_ORIGIN } from '@/data';
import { bearingDeg, distanceKm } from '@/helpers/geo';
import {
  SAMPLE_DISTANCE_KM,
  SAMPLE_MAX_SURFACE_KM,
  SAMPLE_ONLINE_PLAYERS,
  SAMPLE_PLACE_REVEALED,
  SAMPLE_PLAYERS,
  SAMPLE_ROUND_RECORD,
  SAMPLE_TOTALS,
} from '@/helpers/storyFixtures';
import { source } from '~sb/source';

import { OnlineGameScreenView } from '../OnlineGameScreenView';
import answeringCode from './Answering.source.md?raw';
import distancePageCode from './DistancePage.source.md?raw';
import revealedCode from './Revealed.source.md?raw';
import sentCode from './Sent.source.md?raw';

const origin = DEFAULT_ORIGIN.coordinates;
const trueBearing = bearingDeg(origin, SAMPLE_PLACE_REVEALED.coordinates);
const trueDistanceKm = distanceKm(origin, SAMPLE_PLACE_REVEALED.coordinates);
const guesses = SAMPLE_ROUND_RECORD.results.map((result) => result.guess);

// Ce que le container calcule pour la solution : la vraie reponse (jaune) puis une marque par joueur.
const resultMarks = (opacity?: number): EarthMark[] => [
  { bearing: trueBearing, distanceKm: trueDistanceKm, color: '#FACC15', isTruth: true },
  ...guesses.map((guess, index) => ({
    bearing: guess.bearing,
    distanceKm: guess.distanceKm,
    color: SAMPLE_PLAYERS[index].color,
    opacity,
  })),
];

const resultArgs = {
  answered: [true, true, true],
  extraNeedles: guesses.map((guess, index) => ({ bearing: guess.bearing, color: SAMPLE_PLAYERS[index].color })),
  localIndex: 0,
  onKick: () => {},
  players: SAMPLE_ONLINE_PLAYERS,
  record: SAMPLE_ROUND_RECORD,
  totals: SAMPLE_TOTALS,
  truthBearing: trueBearing,
};

const meta = {
  title: 'Screens/OnlineGameScreenView',
  component: OnlineGameScreenView,
  // `Screen` reserve toute sa hauteur : il lui faut un parent flex a hauteur fixe.
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 800, width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    scrollRef: { current: null },
    onQuit: () => {},
    name: SAMPLE_PLAYERS[0].name,
    points: 0,
    roomCode: 'bagu',
    difficulty: 'intermediate',
    roundNumber: 2,
    totalRounds: 5,
    place: SAMPLE_PLACE_REVEALED,
    earthMarks: [{ bearing: 75, distanceKm: SAMPLE_DISTANCE_KM, color: SAMPLE_PLAYERS[0].color }],
    origin,
    showCountry: true,
    compassColor: SAMPLE_PLAYERS[0].color,
    bearing: 75,
    onSetBearing: () => {},
    distanceKm: SAMPLE_DISTANCE_KM,
    onSetDistanceKm: () => {},
    maxDistanceKm: SAMPLE_MAX_SURFACE_KM,
    onCap: true,
    onScroll: () => {},
    onGoToCap: () => {},
    onGoToDistance: () => {},
    onSubmit: () => {},
    submitDisabled: false,
    onReact: () => {},
  },
} satisfies Meta<typeof OnlineGameScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Manche en cours, page cap : la boussole se tourne au doigt, le pied propose de passer a la distance. */
export const Answering: Story = {
  parameters: source(answeringCode),
};

/** Page distance (apres un defilement ou le bouton du pied) : la Terre et le curseur, puis « Valider ». */
export const DistancePage: Story = {
  parameters: source(distancePageCode),
  args: { onCap: false, distanceKm: 6000 },
};

/**
 * Reponse envoyee : meme mise en page que la solution, avec les reponses deja arrivees, qui a repondu et un pied
 * « en attente des autres ». La vraie reponse n'apparait qu'une fois tout le monde passe.
 */
export const Sent: Story = {
  parameters: source(sentCode),
  args: {
    ...resultArgs,
    answered: [true, true, false],
    confirmed: false,
    earthMarks: resultMarks().slice(1, 3),
    extraNeedles: resultArgs.extraNeedles.slice(0, 2),
    truthBearing: null,
  },
};

/** Solution a plusieurs : vrai cap en jaune, une aiguille et un trajet par joueur, scores, puis « Manche suivante » (hote). */
export const Revealed: Story = {
  parameters: source(revealedCode),
  args: {
    ...resultArgs,
    answered: undefined,
    confirmed: true,
    earthMarks: resultMarks(0.8),
    isHost: true,
    isLastRound: false,
    location: 'Vous êtes à Paris',
    onNextRound: () => {},
    points: SAMPLE_TOTALS[0],
  },
};

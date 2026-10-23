import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { Globe3D } from './Globe3D';
import parisNewYorkCode from './ParisNewYork.source.md?raw';
import bareWithGuidesCode from './BareWithGuides.source.md?raw';
import tokyoSydneyCode from './TokyoSydney.source.md?raw';

const meta = {
  title: 'Common/Globe3D',
  component: Globe3D,
} satisfies Meta<typeof Globe3D>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Deux reponses depuis Paris : la vraie (point entoure, sans route) et une estimation dont la route suit la courbe
 * de la boule. Glisser pour tourner, pincer (ou +/−) pour zoomer, "⌖ N" pour revenir a la vue de depart. */
export const ParisNewYork: Story = {
  parameters: source(parisNewYorkCode),
  args: {
    size: 320,
    origin: { latitude: 48.8566, longitude: 2.3522 },
    marks: [
      { bearing: 261.4, distanceKm: 6079, color: SAMPLE_PLAYERS[0].color, isTruth: true },
      { bearing: 270, distanceKm: 5000, color: SAMPLE_PLAYERS[1].color },
    ],
  },
};

/** Longue route vers l'autre hemisphere : le globe montre d'abord le milieu du trajet, la route passe derriere
 * ou la Terre s'incurve. */
export const TokyoSydney: Story = {
  parameters: source(tokyoSydneyCode),
  args: {
    size: 320,
    origin: { latitude: 35.68, longitude: 139.69 },
    marks: [{ bearing: 171.2, distanceKm: 7826, color: SAMPLE_PLAYERS[2].color }],
  },
};

/** Boule nue avec equateur et meridien de Greenwich (pointilles) : assez pour lire ou est la reponse, sans les
 * terres. `draggable={false}` retire le tour a la main, le zoom et leurs boutons. */
export const BareWithGuides: Story = {
  parameters: source(bareWithGuidesCode),
  args: {
    size: 320,
    origin: { latitude: 48.8566, longitude: 2.3522 },
    land: false,
    equator: true,
    greenwich: true,
    draggable: false,
    marks: [{ bearing: 261.4, distanceKm: 6079, color: SAMPLE_PLAYERS[0].color, isTruth: true }],
  },
};

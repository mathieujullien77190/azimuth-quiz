import type { Meta, StoryObj } from '@storybook/react-vite';

import { DEFAULT_SETTINGS } from '@/data/game';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { SAMPLE_PARTY, SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { localizedArgs } from '~sb/localized';
import { source } from '~sb/source';

import { SetupScreenView } from '../SetupScreenView';
import hostingCode from './Hosting.source.md?raw';
import joinedCode from './Joined.source.md?raw';
import joiningCode from './Joining.source.md?raw';
import nameTakenCode from './NameTaken.source.md?raw';
import soloCode from './Solo.source.md?raw';

const t = translations.fr;

const HOST_UID = 'host-uid';
const JOINER_UID = 'joiner-uid';

// Joueurs de la room, tels que `useSetupRoom` les donne (l'hote en premier).
const connectedPlayers: typeof SAMPLE_PARTY.connectedPlayers = [
  [HOST_UID, { name: SAMPLE_PLAYERS[0].name, joinedAt: null, color: SAMPLE_PLAYERS[0].color }],
  [JOINER_UID, { name: SAMPLE_PLAYERS[1].name, joinedAt: null, color: SAMPLE_PLAYERS[1].color }],
];

/** Message de l'overlay (notice lecture seule) dans la langue de la barre d'outils. */
const noticeArgs = (texts: Translations) => ({ overlayMessage: texts.setup.readOnlyNotice });

const meta = {
  title: 'Screens/SetupScreenView',
  component: SetupScreenView,
  // `Screen` reserve toute sa hauteur : il lui faut un parent flex a hauteur fixe.
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 760, width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    settings: DEFAULT_SETTINGS,
    ready: true,
    available: 1840,
    party: SAMPLE_PARTY,
    readOnly: false,
    onToggleCategory: () => {},
    onSelectDifficulty: () => {},
    onSelectRounds: () => {},
    onToggleUseGps: () => {},
    onChangeCustomOrigin: () => {},
    onToggleShowCountry: () => {},
    onToggleTravel: () => {},
    overlayMessage: null,
    overlayLoading: false,
    onDismissOverlay: () => {},
    startDisabled: false,
    onStartPress: () => {},
    onBack: () => {},
  },
} satisfies Meta<typeof SetupScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Partie en solo : categories, difficulte, manches et options, puis « Lancer la partie ». */
export const Solo: Story = {
  parameters: source(soloCode),
};

/** Hote : le code de la room s'affiche, les joueurs arrivent dessous (croix « expulser » sur les autres). */
export const Hosting: Story = {
  parameters: source(hostingCode),
  args: {
    party: {
      ...SAMPLE_PARTY,
      nameEditable: false,
      connectedPlayers,
      localUid: HOST_UID,
      hostUid: HOST_UID,
      isHost: true,
      onlineChoice: 'host',
      roomCode: 'bagu',
    },
  },
};

/** « Rejoindre » avant d'avoir rejoint : les reglages restent masques, seul le champ du code est la. */
export const Joining: Story = {
  parameters: source(joiningCode),
  args: {
    party: { ...SAMPLE_PARTY, onlineChoice: 'join', joinCode: 'ba' },
    readOnly: true,
  },
};

/** Partie rejointe : les reglages de l'hote s'affichent en lecture seule (un tap ouvre la notice) et pas de lancement. */
export const Joined: Story = {
  parameters: source(joinedCode),
  decorators: [localizedArgs(noticeArgs)],
  args: {
    ...noticeArgs(t),
    party: {
      ...SAMPLE_PARTY,
      soloName: SAMPLE_PLAYERS[1].name,
      nameEditable: false,
      connectedPlayers,
      localUid: JOINER_UID,
      hostUid: HOST_UID,
      isHost: false,
      onlineChoice: 'join',
      joinCode: 'bagu',
      joinCodeIsValid: true,
      joinStatus: 'valid',
    },
    readOnly: true,
    settings: { ...DEFAULT_SETTINGS, categories: ['capital', 'cities'], difficulty: 'hard', rounds: 8, travel: true },
  },
};

/** Bloc « partie » quand la room refuse le pseudo. */
const takenParty = (texts: Translations): Partial<typeof SAMPLE_PARTY> => {
  return {
    nameError: texts.setup.online.nameTaken,
    connectedPlayers,
    hostUid: HOST_UID,
    onlineChoice: 'join',
    joinCode: 'bagu',
    joinCodeIsValid: true,
    joinStatus: 'valid',
  };
};

/** Pseudo deja pris dans la room : le champ se rouvre avec la raison dessous. */
export const NameTaken: Story = {
  name: 'Name already taken',
  parameters: source(nameTakenCode),
  decorators: [localizedArgs((texts) => ({ party: { ...SAMPLE_PARTY, ...takenParty(texts) } }))],
  args: { party: { ...SAMPLE_PARTY, ...takenParty(t) } },
};

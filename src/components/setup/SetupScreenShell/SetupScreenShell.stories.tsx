import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import DifficultySection from '@/components/setup/DifficultySection';
import RoundsSection from '@/components/setup/RoundsSection';
import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import { GAME_ICONS, PLAYER_COLORS } from '@/data';
import { translations } from '@/i18n/translations';
import { source } from '@/storybook/source';

import joinerCode from './Joiner.source.md?raw';
import { SetupScreenShell } from './SetupScreenShell';
import soloCode from './Solo.source.md?raw';
import startingCode from './Starting.source.md?raw';

const t = translations.fr;

// In the app all of this comes from `useSetupRoom` (Firestore room, host/join, players...): here
// it's frozen so the shell can be looked at on its own.
const party: SetupPartyProps = {
  soloName: '',
  soloPlaceholder: 'Zoé',
  soloColor: PLAYER_COLORS[0],
  nameEditable: true,
  onChangeName: fn(),
  connectedPlayers: [],
  localUid: null,
  hostUid: null,
  isHost: false,
  onKick: fn(),
  onlineChoice: null,
  onChooseSolo: fn(),
  onChooseHost: fn(),
  onChooseJoin: fn(),
  roomCode: null,
  joinCode: '',
  onJoinCodeChange: fn(),
  joinCodeIsValid: false,
  joinStatus: 'idle',
};

const meta = {
  title: 'Setup/SetupScreenShell',
  component: SetupScreenShell,
  // `Screen` reserves its full height (SafeAreaView -> ScrollView): it needs a fixed-height flex box.
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 640, width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    backLabel: t.setup.quit,
    onBack: fn(),
    onDismissOverlay: fn(),
    onStartPress: fn(),
    overlayMessage: null,
    party,
    startDisabled: false,
    startLabel: t.setup.start,
    title: t.home.games.compass.title,
    icon: GAME_ICONS.compass,
    children: (
      <>
        <DifficultySection
          hint={t.setup.difficultyHint}
          onSelect={fn()}
          selected="intermediate"
          title={t.setup.difficultyTitle}
        />
        <RoundsSection onSelect={fn()} rounds={5} />
      </>
    ),
  },
} satisfies Meta<typeof SetupScreenShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The common frame of every game's setup: title, the solo/host/join block, the game's own sections
 * as `children`, then "Lancer la partie" and "Quitter". */
export const Solo: Story = {
  parameters: source(soloCode),
};

/** A joiner never sees "Lancer la partie" — only the host starts the game — and the read-only
 * notice is the overlay a tap on a locked option raises. */
export const Joiner: Story = {
  parameters: source(joinerCode),
  args: {
    overlayMessage: t.setup.readOnlyNotice,
    party: { ...party, onlineChoice: 'join', joinCode: 'tabofuna', joinCodeIsValid: true, joinStatus: 'valid' },
  },
};

/** "Lancer la partie" pressed: the setup stays visible and the "Préparation de la partie…" splash
 * (a spinner) covers it until the game screen takes over. */
export const Starting: Story = {
  parameters: source(startingCode),
  args: { overlayLoading: true, overlayMessage: t.game.loading },
};

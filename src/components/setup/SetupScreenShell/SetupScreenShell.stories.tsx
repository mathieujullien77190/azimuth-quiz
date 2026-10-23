import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import DifficultySection from '@/components/setup/DifficultySection';
import RoundsSection from '@/components/setup/RoundsSection';
import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import { GAME_ICONS, PLAYER_COLORS } from '@/data';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import joinerCode from './Joiner.source.md?raw';
import { SetupScreenShell } from './SetupScreenShell';
import soloCode from './Solo.source.md?raw';
import startingCode from './Starting.source.md?raw';

const t = translations.fr;

// Dans l'app tout ceci vient de `useSetupRoom` (room Firestore, hote/joiner, joueurs...) : ici c'est fige pour
// voir le shell seul.
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

/** Tous les textes du cadre et les sections propres au jeu qu'il enveloppe, dans la langue de la barre d'outils. */
const textArgs = (texts: Translations) => ({
  backLabel: texts.setup.quit,
  startLabel: texts.setup.start,
  title: texts.home.games.compass.title,
  children: (
    <>
      <DifficultySection
        hint={texts.setup.difficultyHint}
        onSelect={fn()}
        selected="intermediate"
        title={texts.setup.difficultyTitle}
      />
      <RoundsSection onSelect={fn()} rounds={5} />
    </>
  ),
});

const meta = {
  title: 'Setup/SetupScreenShell',
  component: SetupScreenShell,
  // `Screen` reserve toute sa hauteur (SafeAreaView -> ScrollView) : il lui faut un parent flex a hauteur fixe.
  decorators: [
    localizedArgs(textArgs),
    (Story) => (
      <div style={{ display: 'flex', height: 640, width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    ...textArgs(t),
    onBack: fn(),
    onDismissOverlay: fn(),
    onStartPress: fn(),
    overlayMessage: null,
    party,
    startDisabled: false,
    icon: GAME_ICONS.compass,
  },
} satisfies Meta<typeof SetupScreenShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Cadre commun du setup de chaque jeu : titre, bloc solo/hote/rejoindre, sections du jeu en `children`, puis
 * « Lancer la partie » et « Quitter ».
 */
export const Solo: Story = {
  parameters: source(soloCode),
};

/**
 * Un joiner ne voit jamais « Lancer la partie » (seul l'hote lance) ; la notice lecture seule est l'overlay
 * qu'affiche un tap sur une option verrouillee.
 */
export const Joiner: Story = {
  parameters: source(joinerCode),
  decorators: [localizedArgs((texts) => ({ overlayMessage: texts.setup.readOnlyNotice }))],
  args: {
    overlayMessage: t.setup.readOnlyNotice,
    party: { ...party, onlineChoice: 'join', joinCode: 'tabofuna', joinCodeIsValid: true, joinStatus: 'valid' },
  },
};

/**
 * « Lancer la partie » appuye : le setup reste visible et le splash « Preparation de la partie... » (spinner)
 * le couvre jusqu'a ce que l'ecran de jeu prenne le relais.
 */
export const Starting: Story = {
  parameters: source(startingCode),
  decorators: [localizedArgs((texts) => ({ overlayMessage: texts.game.loading }))],
  args: { overlayLoading: true, overlayMessage: t.game.loading },
};

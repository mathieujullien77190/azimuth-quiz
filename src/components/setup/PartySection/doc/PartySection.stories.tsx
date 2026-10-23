import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PLAYER_COLORS } from '@/data';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '~sb/localized';

import { PartySection } from '../PartySection';
import type { PartySectionPlayer, PartySectionProps } from '../types';
import { source } from '~sb/source';
import soloCode from './Solo.source.md?raw';
import hostingCode from './Hosting.source.md?raw';
import generatingCodeCode from './GeneratingCode.source.md?raw';
import joinedCode from './Joined.source.md?raw';
import nameTakenCode from './NameTaken.source.md?raw';

const t = translations.fr;

const partyText = (texts: Translations) => ({
  title: texts.setup.playersSection.title,
  hint: texts.setup.playersSection.hint,
});

const HOST_UID = 'host-uid';
const JOINER_UID = 'joiner-uid';

const connectedPlayers: [string, PartySectionPlayer][] = [
  [HOST_UID, { name: 'Zoé', joinedAt: null, color: PLAYER_COLORS[0] }],
  [JOINER_UID, { name: 'Max', joinedAt: null, color: PLAYER_COLORS[1] }],
];

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. Seuls la puce solo/hote/rejoindre,
 * le nom solo et le code a rejoindre sont branches sur un state local, sans simuler de room Firestore.
 */
const InteractiveDemo = (args: PartySectionProps) => {
  const [onlineChoice, setOnlineChoice] = useState(args.onlineChoice);
  const [soloName, setSoloName] = useState(args.soloName);
  const [joinCode, setJoinCode] = useState(args.joinCode);

  return (
    <PartySection
      {...args}
      joinCode={joinCode}
      onChangeName={(text) => {
        args.onChangeName(text);
        setSoloName(text);
      }}
      onChooseHost={() => {
        args.onChooseHost();
        setOnlineChoice('host');
      }}
      onChooseJoin={() => {
        args.onChooseJoin();
        setOnlineChoice('join');
      }}
      onChooseSolo={() => {
        args.onChooseSolo();
        setOnlineChoice(null);
      }}
      onJoinCodeChange={(text) => {
        args.onJoinCodeChange(text);
        setJoinCode(text);
      }}
      onlineChoice={onlineChoice}
      soloName={soloName}
    />
  );
};

const meta = {
  title: 'Setup/PartySection',
  component: PartySection,
  decorators: [
    localizedArgs(partyText),
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PartySection>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Aucune room : juste le champ nom de cet appareil et la rangee de puces Solo/Hote/Rejoindre (un clic change ce
 * qui est affiche dessous).
 */
export const Solo: Story = {
  parameters: source(soloCode),
  args: {
    ...partyText(t),
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
  },
  render: InteractiveDemo,
};

/**
 * Hebergement : champ du code genere, plus un autre joueur connecte avec la croix « expulser » de l'hote a cote
 * de son nom (cet appareil est `localUid`, donc pas de croix sur sa propre ligne, qui est `soloName`).
 */
export const Hosting: Story = {
  parameters: source(hostingCode),
  args: {
    ...Solo.args,
    soloName: 'Zoé',
    connectedPlayers,
    localUid: HOST_UID,
    hostUid: HOST_UID,
    isHost: true,
    onlineChoice: 'host',
    roomCode: 'bagu',
  },
  render: InteractiveDemo,
};

/**
 * « Heberger » vient d'etre choisi : le code n'est pas encore revenu de Firestore (quelques secondes en connexion
 * lente), le champ montre son placeholder « creation... » avec un spinner.
 */
export const GeneratingCode: Story = {
  parameters: source(generatingCodeCode),
  args: {
    ...Solo.args,
    soloName: 'Zoé',
    localUid: HOST_UID,
    hostUid: HOST_UID,
    isHost: true,
    onlineChoice: 'host',
    roomCode: null,
  },
  render: InteractiveDemo,
};

/**
 * Room d'un autre rejointe : le champ code se verrouille et la puce devient « Quitter » ; les autres champs
 * (dont le nom de cet appareil) restent visibles en lecture seule.
 */
export const Joined: Story = {
  parameters: source(joinedCode),
  args: {
    ...Solo.args,
    soloName: 'Max',
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
  render: InteractiveDemo,
};

/**
 * Nom deja pris par un autre joueur : la room le refuse, le champ se rouvre avec la raison dessous, et saisir un
 * autre nom retente.
 */
export const NameTaken: Story = {
  name: 'Name already taken',
  parameters: source(nameTakenCode),
  decorators: [localizedArgs((t) => ({ nameError: t.setup.online.nameTaken }))],
  args: {
    ...Solo.args,
    soloName: 'Zoé',
    nameEditable: true,
    nameError: translations.fr.setup.online.nameTaken,
    connectedPlayers,
    localUid: null,
    hostUid: HOST_UID,
    isHost: false,
    onlineChoice: 'join',
    joinCode: 'bagu',
    joinCodeIsValid: true,
    joinStatus: 'valid',
  },
  render: InteractiveDemo,
};

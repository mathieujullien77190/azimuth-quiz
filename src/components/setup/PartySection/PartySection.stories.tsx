import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PLAYER_COLORS } from '@/data';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';

import { PartySection } from './PartySection';
import type { PartySectionPlayer, PartySectionProps } from './types';
import { source } from '@/storybook/source';
import soloCode from './Solo.source.md?raw';
import hostingCode from './Hosting.source.md?raw';
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

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. Only the
 * solo/host/join chip, the solo name field and the join code field are wired to local state:
 * enough to click through the whole flow, without simulating a real Firestore room. */
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

/** Not connected to any room: just this device's own name field, and the Solo/Host/Join chip
 * row — clicking a chip actually switches which one is shown below. */
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

/** Hosting a room: the generated code field, plus one other connected player with the host's own
 * "kick" cross next to their name (this device is `localUid`, so it never shows a cross on its
 * own row — there isn't one here, `soloName` is that row instead). */
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

/** Joined someone else's room: the code field locks and the chip turns into "Leave" — every
 * other field (including this device's own name) stays visible but read-only. */
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

/** Joining under a name another player already has: the room refuses it, the field opens up again
 * with the reason under it, and typing another name tries again. */
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

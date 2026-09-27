import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PLAYER_COLORS } from '@/data';
import { translations } from '@/i18n/translations';

import { PartySection } from './PartySection';
import type { PartySectionPlayer, PartySectionProps } from './types';

const t = translations.fr;

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
  title: 'Common/Setup/PartySection',
  component: PartySection,
  decorators: [
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
  args: {
    title: t.setup.playersSection.title,
    hint: t.setup.playersSection.hint,
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

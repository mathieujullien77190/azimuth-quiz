import { fireEvent, render } from '@testing-library/react-native';

import PartySection from '.';
import type { PartySectionProps } from './types';

const baseProps: PartySectionProps = {
  title: 'Partie',
  soloName: 'Zoé',
  soloPlaceholder: 'Nom',
  soloColor: '#EF4444',
  nameEditable: true,
  onChangeName: jest.fn(),
  connectedPlayers: [],
  localUid: 'zoe',
  hostUid: 'zoe',
  isHost: false,
  onKick: jest.fn(),
  onlineChoice: null,
  onChooseSolo: jest.fn(),
  onChooseHost: jest.fn(),
  onChooseJoin: jest.fn(),
  roomCode: null,
  joinCode: '',
  onJoinCodeChange: jest.fn(),
  joinCodeIsValid: false,
  joinStatus: 'idle',
};

const renderSection = (overrides: Partial<PartySectionProps> = {}) =>
  render(<PartySection {...baseProps} {...overrides} />);

const player = (name: string, color?: string) => ({ name, joinedAt: null, color });

beforeEach(() => jest.clearAllMocks());

describe('PartySection — own name', () => {
  it('shows the solo name and forwards edits while editable', async () => {
    const { getByDisplayValue } = await renderSection();
    await fireEvent.changeText(getByDisplayValue('Zoé'), 'Max');
    expect(baseProps.onChangeName).toHaveBeenCalledWith('Max');
  });

  it('shows the initials of the placeholder when the name is blank', async () => {
    const { getByText } = await renderSection({ soloName: '  ', soloPlaceholder: 'Nono' });
    expect(getByText('NO')).toBeTruthy();
  });

  it('locks the name once connected', async () => {
    const { getByDisplayValue } = await renderSection({ nameEditable: false });
    expect(getByDisplayValue('Zoé').props.editable).toBe(false);
  });
});

describe('PartySection — other players', () => {
  const players: [string, ReturnType<typeof player>][] = [
    ['zoe', player('Zoé', '#EF4444')],
    ['max', player('Max')],
    ['eve', player('Eve', '#16A34A')],
  ];

  it('lists everyone but this device, marking the host', async () => {
    const { getByDisplayValue, queryByDisplayValue } = await renderSection({
      connectedPlayers: players,
      hostUid: 'max',
    });
    expect(getByDisplayValue('Max (hôte)')).toBeTruthy();
    expect(getByDisplayValue('Eve')).toBeTruthy();
    expect(queryByDisplayValue('Zoé (hôte)')).toBeNull();
  });

  it('gives the host a kick button per other player, wired to that player', async () => {
    const { getAllByText, getByLabelText } = await renderSection({
      connectedPlayers: players,
      hostUid: 'zoe',
      isHost: true,
    });
    expect(getAllByText('Expulser')).toHaveLength(2);
    await fireEvent.press(getByLabelText('Retirer Eve'));
    expect(baseProps.onKick).toHaveBeenCalledWith('eve');
  });

  it('shows no kick button to a joiner', async () => {
    const { queryByText } = await renderSection({ connectedPlayers: players, hostUid: 'max', isHost: false });
    expect(queryByText('Expulser')).toBeNull();
  });
});

describe('PartySection — solo / host / join', () => {
  it('forwards the three chips', async () => {
    const { getByText } = await renderSection();
    await fireEvent.press(getByText('Jouer seul'));
    await fireEvent.press(getByText('Créer'));
    await fireEvent.press(getByText('Rejoindre'));
    expect(baseProps.onChooseSolo).toHaveBeenCalledTimes(1);
    expect(baseProps.onChooseHost).toHaveBeenCalledTimes(1);
    expect(baseProps.onChooseJoin).toHaveBeenCalledTimes(1);
  });

  it('host: shows the generated code, or a placeholder while it is being created', async () => {
    const { getByDisplayValue, rerender, getByPlaceholderText } = await renderSection({
      onlineChoice: 'host',
      roomCode: null,
    });
    expect(getByPlaceholderText('Création du code…')).toBeTruthy();
    await rerender(<PartySection {...baseProps} onlineChoice="host" roomCode="tabofuna" />);
    expect(getByDisplayValue('tabofuna')).toBeTruthy();
  });

  it('join: forwards the typed code', async () => {
    const { getByPlaceholderText } = await renderSection({ onlineChoice: 'join' });
    await fireEvent.changeText(getByPlaceholderText('Code de la partie'), 'tabofuna');
    expect(baseProps.onJoinCodeChange).toHaveBeenCalledWith('tabofuna');
  });

  it('join: explains an unknown code only once it looks well-formed', async () => {
    const { queryByText, rerender } = await renderSection({
      onlineChoice: 'join',
      joinCode: 'abc',
      joinCodeIsValid: false,
      joinStatus: 'invalid',
    });
    expect(queryByText('Code introuvable.')).toBeNull();
    await rerender(
      <PartySection {...baseProps} joinCode="tabofuna" joinCodeIsValid joinStatus="invalid" onlineChoice="join" />,
    );
    expect(queryByText('Code introuvable.')).toBeTruthy();
  });

  it('join: once connected, locks the field, confirms it and turns "Rejoindre" into "Quitter"', async () => {
    const { getByText, getByDisplayValue, queryByText } = await renderSection({
      onlineChoice: 'join',
      joinCode: ' tabofuna ',
      joinCodeIsValid: true,
      joinStatus: 'valid',
    });
    expect(getByDisplayValue(' tabofuna ').props.editable).toBe(false);
    expect(getByText('Connecté à la partie tabofuna !')).toBeTruthy();
    expect(queryByText('Rejoindre')).toBeNull();
    await fireEvent.press(getByText('Quitter'));
    expect(baseProps.onChooseJoin).toHaveBeenCalledTimes(1);
  });
});

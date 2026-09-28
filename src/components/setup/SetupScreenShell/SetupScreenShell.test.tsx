import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { SetupPartyProps } from '@/components/setup/useSetupRoom';

import SetupScreenShell from '.';

const party: SetupPartyProps = {
  soloName: 'Zoé',
  soloPlaceholder: 'Nom',
  soloColor: '#EF4444',
  nameEditable: true,
  onChangeName: jest.fn(),
  connectedPlayers: [],
  localUid: null,
  hostUid: null,
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

const baseProps = {
  title: 'Boussole',
  icon: '🧭',
  party,
  overlayMessage: null,
  onDismissOverlay: jest.fn(),
  startLabel: 'Lancer la partie',
  backLabel: 'Retour',
  startDisabled: false,
  onStartPress: jest.fn(),
  onBack: jest.fn(),
};

const renderShell = (props: Partial<React.ComponentProps<typeof SetupScreenShell>> = {}) =>
  render(
    <SetupScreenShell {...baseProps} {...props}>
      <Text>Sections du jeu</Text>
    </SetupScreenShell>,
  );

beforeEach(() => jest.clearAllMocks());

describe('SetupScreenShell', () => {
  it('shows the title, the party block and the game sections', async () => {
    const { getByText } = await renderShell();
    expect(getByText('Boussole')).toBeTruthy();
    expect(getByText('🧭')).toBeTruthy();
    expect(getByText('Jouer seul')).toBeTruthy();
    expect(getByText('Sections du jeu')).toBeTruthy();
  });

  it('starts and goes back', async () => {
    const { getByText } = await renderShell();
    await fireEvent.press(getByText('Lancer la partie'));
    await fireEvent.press(getByText('Retour'));
    expect(baseProps.onStartPress).toHaveBeenCalledTimes(1);
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('goes back through the close cross at the top too', async () => {
    const { getByText } = await renderShell();
    await fireEvent.press(getByText('✕'));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('disables "start" on demand', async () => {
    const { getByRole } = await renderShell({ startDisabled: true });
    expect(getByRole('button', { name: 'Lancer la partie' }).props.accessibilityState.disabled).toBe(true);
  });

  it('hides "start" for a joiner: only the host launches', async () => {
    const { queryByText, getByText } = await renderShell({ party: { ...party, onlineChoice: 'join' } });
    expect(queryByText('Lancer la partie')).toBeNull();
    expect(getByText('Retour')).toBeTruthy();
  });

  it('shows the notice overlay, dismissable by tapping it', async () => {
    const { getByText } = await renderShell({ overlayMessage: 'Vous avez été expulsé' });
    await fireEvent.press(getByText('Vous avez été expulsé'));
    expect(baseProps.onDismissOverlay).toHaveBeenCalledTimes(1);
  });

  it('shows no overlay without a message', async () => {
    const { queryByText } = await renderShell();
    expect(queryByText('Préparation de la partie…')).toBeNull();
  });

  it('shows the loading splash while the game is starting', async () => {
    const { getByText } = await renderShell({ overlayMessage: 'Préparation de la partie…', overlayLoading: true });
    expect(getByText('Préparation de la partie…')).toBeTruthy();
  });
});

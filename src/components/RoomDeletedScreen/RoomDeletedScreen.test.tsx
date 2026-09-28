import { fireEvent, render } from '@testing-library/react-native';

import RoomDeletedScreen from '.';

const mockDismissTo = jest.fn();
const mockRouter = { dismissTo: mockDismissTo };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const DELETED = 'L’hôte a supprimé la partie.';

beforeEach(() => mockDismissTo.mockClear());

describe('RoomDeletedScreen', () => {
  it('shows the "host deleted the room" notice by default', async () => {
    const { getByText } = await render(<RoomDeletedScreen />);
    expect(getByText(DELETED)).toBeTruthy();
  });

  it('shows a custom message when given one (lost connection)', async () => {
    const { getByText, queryByText } = await render(<RoomDeletedScreen message="Connexion perdue" />);
    expect(getByText('Connexion perdue')).toBeTruthy();
    expect(queryByText(DELETED)).toBeNull();
  });

  it('sends the player home when the notice is tapped', async () => {
    const { getByText } = await render(<RoomDeletedScreen />);
    await fireEvent.press(getByText(DELETED));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });
});

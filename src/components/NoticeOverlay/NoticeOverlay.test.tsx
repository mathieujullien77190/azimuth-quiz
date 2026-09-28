import { fireEvent, render } from '@testing-library/react-native';

import { SPINNER_COLOR } from './constants';
import NoticeOverlay from '.';

describe('NoticeOverlay', () => {
  it('shows the message and dismisses on tap', async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(<NoticeOverlay message="Partie supprimée" onDismiss={onDismiss} />);
    await fireEvent.press(getByText('Partie supprimée'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores a tap while loading: a wait ends by itself', async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(<NoticeOverlay loading message="Préparation" onDismiss={onDismiss} />);
    await fireEvent.press(getByText('Préparation'));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('needs no handler at all while loading', async () => {
    const { getByText } = await render(<NoticeOverlay loading message="Préparation" />);
    await fireEvent.press(getByText('Préparation'));
    expect(getByText('Préparation')).toBeTruthy();
  });

  it('shows nothing while the message is null', async () => {
    const { queryByText } = await render(<NoticeOverlay message={null} onDismiss={jest.fn()} />);
    expect(queryByText(/./)).toBeNull();
  });

  it('turns a spinner above the message while loading', async () => {
    const { toJSON } = await render(<NoticeOverlay loading message="Préparation" onDismiss={jest.fn()} />);
    expect(JSON.stringify(toJSON())).toContain(SPINNER_COLOR);
  });

  it('shows no spinner by default', async () => {
    const { toJSON } = await render(<NoticeOverlay message="Préparation" onDismiss={jest.fn()} />);
    expect(JSON.stringify(toJSON())).not.toContain(SPINNER_COLOR);
  });
});

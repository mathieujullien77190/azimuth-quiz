import { fireEvent, render } from '@testing-library/react-native';

import ReactionBar from '.';

const EMOJIS = ['🤔', '🤞', '👍'] as const;
const renderBar = (onPick = jest.fn()) =>
  render(
    <ReactionBar emojis={EMOJIS} labelFor={(emoji) => `Envoyer ${emoji}`} onPick={onPick} toggleLabel="Réactions" />,
  );

describe('ReactionBar', () => {
  it('shows only the round button at first, the emojis are not there', async () => {
    const { getByLabelText, queryByLabelText } = await renderBar();
    expect(getByLabelText('Réactions')).toBeTruthy();
    EMOJIS.forEach((emoji) => expect(queryByLabelText(`Envoyer ${emoji}`)).toBeNull());
  });

  it('shows the column of emojis, each with its own accessibility label', async () => {
    const { getByLabelText } = await renderBar();
    await fireEvent.press(getByLabelText('Réactions'));
    EMOJIS.forEach((emoji) => expect(getByLabelText(`Envoyer ${emoji}`)).toBeTruthy());
  });

  it('sends the emoji that was tapped and leaves the column open for the next one', async () => {
    const onPick = jest.fn();
    const { getByLabelText, queryByLabelText } = await renderBar(onPick);
    await fireEvent.press(getByLabelText('Réactions'));
    await fireEvent.press(getByLabelText('Envoyer 🤞'));
    expect(onPick).toHaveBeenCalledWith('🤞');
    expect(queryByLabelText('Envoyer 🤞')).toBeTruthy();
    await fireEvent.press(getByLabelText('Envoyer 👍'));
    expect(onPick).toHaveBeenLastCalledWith('👍');
  });

  it('closes the column with the round button again, sending nothing', async () => {
    const onPick = jest.fn();
    const { getByLabelText, queryByLabelText } = await renderBar(onPick);
    await fireEvent.press(getByLabelText('Réactions'));
    await fireEvent.press(getByLabelText('Réactions'));
    expect(queryByLabelText('Envoyer 🤞')).toBeNull();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('says whether the column is open to assistive technology', async () => {
    const { getByLabelText } = await renderBar();
    expect(getByLabelText('Réactions').props.accessibilityState).toEqual({ expanded: false });
    await fireEvent.press(getByLabelText('Réactions'));
    expect(getByLabelText('Réactions').props.accessibilityState).toEqual({ expanded: true });
  });

  it('shows the pressed state while a finger is down', async () => {
    const { getByLabelText } = await renderBar();
    await fireEvent(getByLabelText('Réactions'), 'pressIn');
    await fireEvent.press(getByLabelText('Réactions'));
    await fireEvent(getByLabelText('Envoyer 🤞'), 'pressIn');
    expect(getByLabelText('Envoyer 🤞')).toBeTruthy();
  });
});

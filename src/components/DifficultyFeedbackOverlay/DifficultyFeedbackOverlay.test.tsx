import { fireEvent, render } from '@testing-library/react-native';

import DifficultyFeedbackOverlay from '.';

describe('DifficultyFeedbackOverlay', () => {
  it('asks the question with the three answers', async () => {
    const { getByText } = await render(
      <DifficultyFeedbackOverlay onChoose={jest.fn()} onDismiss={jest.fn()} question="Le lieu Paris était-il…" />,
    );
    expect(getByText('Le lieu Paris était-il…')).toBeTruthy();
    expect(getByText(/Facile/)).toBeTruthy();
    expect(getByText(/Moyen/)).toBeTruthy();
    expect(getByText(/Difficile/)).toBeTruthy();
  });

  it('reports the answer that was tapped, and nothing else', async () => {
    const onChoose = jest.fn();
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <DifficultyFeedbackOverlay onChoose={onChoose} onDismiss={onDismiss} question="Le lieu Paris était-il…" />,
    );
    await fireEvent.press(getByText(/Difficile/));
    expect(onChoose).toHaveBeenCalledWith('hard');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('closes on a tap beside the answers, but not on the card itself', async () => {
    const onChoose = jest.fn();
    const onDismiss = jest.fn();
    const { getByLabelText, getByText } = await render(
      <DifficultyFeedbackOverlay onChoose={onChoose} onDismiss={onDismiss} question="Le lieu Paris était-il…" />,
    );
    await fireEvent.press(getByText('Le lieu Paris était-il…'));
    expect(onDismiss).not.toHaveBeenCalled();
    await fireEvent.press(getByLabelText('Fermer sans répondre'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('shows nothing while there is no question', async () => {
    const { queryByText } = await render(
      <DifficultyFeedbackOverlay onChoose={jest.fn()} onDismiss={jest.fn()} question={null} />,
    );
    expect(queryByText(/Facile/)).toBeNull();
  });
});

import { fireEvent, render } from '@testing-library/react-native';

import { CLUE_PLACES } from '@/data';
import { CLUE_ORDER } from '@/games/clues/constants';
import type { ClueId, CluePlace } from '@/types';

import ClueGrid from '.';

const place: CluePlace = CLUE_PLACES.find((p) => p.country === 'France')!;

const baseProps = {
  place,
  bearingDeg: 90,
  distanceKm: 1000,
  revealedClueIds: [] as ClueId[],
  roundOver: false,
};

const renderGrid = (props: Partial<React.ComponentProps<typeof ClueGrid>> = {}) =>
  render(<ClueGrid {...baseProps} {...props} />);

describe('ClueGrid', () => {
  it('renders one card per clue, all locked at the start, without the vowels card', async () => {
    const { getAllByText, queryByText } = await renderGrid();
    expect(getAllByText('🔒')).toHaveLength(CLUE_ORDER.length);
    expect(queryByText('Voyelles')).toBeNull();
  });

  it('reveals the picked clues', async () => {
    const { getAllByText } = await renderGrid({ revealedClueIds: ['isCapital'] });
    expect(getAllByText('🔒')).toHaveLength(CLUE_ORDER.length - 1);
  });

  it('is read-only without onPickClue', async () => {
    const { queryAllByRole } = await renderGrid();
    expect(queryAllByRole('button')).toHaveLength(0);
  });

  it('reports the picked clue', async () => {
    const onPickClue = jest.fn();
    const { getAllByRole } = await renderGrid({ onPickClue });
    await fireEvent.press(getAllByRole('button')[0]);
    expect(onPickClue).toHaveBeenCalledWith(CLUE_ORDER[0]);
  });

  it('reveals everything once the round is over, even what was never picked', async () => {
    const { queryByText } = await renderGrid({ roundOver: true });
    expect(queryByText('🔒')).toBeNull();
  });

  it('unlocks the vowels card once every other clue was picked, and reports it as its own pick', async () => {
    const onPickClue = jest.fn();
    const { getByText } = await renderGrid({ revealedClueIds: [...CLUE_ORDER], onPickClue });
    const vowelsCard = getByText('Voyelles');
    expect(vowelsCard).toBeTruthy();
    await fireEvent.press(vowelsCard);
    expect(onPickClue).toHaveBeenCalledWith('vowels');
  });

  it('shows the vowels card as revealed once picked, or once the round is over', async () => {
    const picked = await renderGrid({ revealedClueIds: [...CLUE_ORDER, 'vowels'] });
    expect(picked.queryByText('🔒')).toBeNull();
    await picked.unmount();
    const over = await renderGrid({ revealedClueIds: [...CLUE_ORDER], roundOver: true });
    expect(over.queryByText('🔒')).toBeNull();
  });

  it('never shows the vowels card for a round given up early, even when over', async () => {
    const { queryByText } = await renderGrid({ revealedClueIds: ['isCapital'], roundOver: true });
    expect(queryByText('Voyelles')).toBeNull();
  });
});

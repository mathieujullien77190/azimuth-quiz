import { fireEvent, render } from '@testing-library/react-native';

import { CLUE_PLACES } from '@/data';
import { cluesFor } from '@/games/clues/helpers/clueGame';
import { personalityFor } from '@/games/clues/helpers/personality';
import { wordplayFor } from '@/games/clues/helpers/wordplay';
import type { ClueId, CluePlace } from '@/types';

import ClueGrid from '.';

jest.mock('@/games/clues/helpers/personality', () => ({ personalityFor: jest.fn(() => null) }));
jest.mock('@/games/clues/helpers/wordplay', () => ({
  ...jest.requireActual('@/games/clues/helpers/wordplay'),
  wordplayFor: jest.fn(() => null),
}));

const place: CluePlace = CLUE_PLACES.find((p) => p.name === 'Paris')!; // capital, no citiesFr filtering
const frenchCity: CluePlace = CLUE_PLACES.find((p) => p.name === 'Marseille')!; // citiesFr: fewer clues

const baseProps = {
  place,
  bearingDeg: 90,
  distanceKm: 1000,
  revealedClueIds: [] as ClueId[],
  roundOver: false,
};

const renderGrid = (props: Partial<React.ComponentProps<typeof ClueGrid>> = {}) =>
  render(<ClueGrid {...baseProps} {...props} />);

beforeEach(() => jest.mocked(personalityFor).mockReturnValue(null));

describe('ClueGrid', () => {
  it('renders one card per clue actually offered for the place, all locked at the start, without the vowels card', async () => {
    const availableClueIds = cluesFor(place);
    const { getAllByText, queryByText } = await renderGrid();
    expect(getAllByText('🔒')).toHaveLength(availableClueIds.length);
    expect(queryByText('Voyelles')).toBeNull();
  });

  it('reveals the picked clues', async () => {
    const availableClueIds = cluesFor(place);
    const { getAllByText } = await renderGrid({ revealedClueIds: ['isCapital'] });
    expect(getAllByText('🔒')).toHaveLength(availableClueIds.length - 1);
  });

  it('is read-only without onPickClue', async () => {
    const { queryAllByRole } = await renderGrid();
    expect(queryAllByRole('button')).toHaveLength(0);
  });

  it('reports the picked clue', async () => {
    const onPickClue = jest.fn();
    const { getAllByRole } = await renderGrid({ onPickClue });
    await fireEvent.press(getAllByRole('button')[0]);
    expect(onPickClue).toHaveBeenCalledWith(cluesFor(place)[0]);
  });

  it('reveals everything once the round is over, even what was never picked', async () => {
    const { queryByText } = await renderGrid({ roundOver: true });
    expect(queryByText('🔒')).toBeNull();
  });

  it('unlocks the vowels card once every clue offered was picked, and reports it as its own pick', async () => {
    const onPickClue = jest.fn();
    const { getByText } = await renderGrid({ revealedClueIds: cluesFor(place), onPickClue });
    const vowelsCard = getByText('Voyelles');
    expect(vowelsCard).toBeTruthy();
    await fireEvent.press(vowelsCard);
    expect(onPickClue).toHaveBeenCalledWith('vowels');
  });

  it('shows the vowels card as revealed once picked, or once the round is over', async () => {
    const picked = await renderGrid({ revealedClueIds: [...cluesFor(place), 'vowels'] });
    expect(picked.queryByText('🔒')).toBeNull();
    await picked.unmount();
    const over = await renderGrid({ revealedClueIds: cluesFor(place), roundOver: true });
    expect(over.queryByText('🔒')).toBeNull();
  });

  it('never shows the vowels card for a round given up early, even when over', async () => {
    const { queryByText } = await renderGrid({ revealedClueIds: ['isCapital'], roundOver: true });
    expect(queryByText('Voyelles')).toBeNull();
  });

  it('offers fewer cards for a citiesFr place (drops the clues that never vary for a French city)', async () => {
    const { getAllByText } = await renderGrid({ place: frenchCity });
    expect(getAllByText('🔒')).toHaveLength(cluesFor(frenchCity).length);
    expect(cluesFor(frenchCity).length).toBeLessThan(cluesFor(place).length);
  });

  it('offers the personality card once curated for the place, not before', async () => {
    const before = await renderGrid();
    expect(before.queryByText('Personnalité')).toBeNull();
    await before.unmount();

    jest.mocked(personalityFor).mockReturnValue({ name: 'Quelqu’un', description: null });
    const after = await renderGrid();
    expect(after.queryByText('Personnalité')).toBeTruthy();
  });

  it('reveals the wordplay card in a single pick, no stage badge (single-click clue)', async () => {
    jest.mocked(wordplayFor).mockReturnValue({ sentence: 'Ce lac est Constance.', difficulty: 'intermediate' });
    const { getByText, queryByLabelText } = await renderGrid({ revealedClueIds: ['wordplay'] });
    expect(getByText('Ce lac est Constance.')).toBeTruthy();
    expect(queryByLabelText('1/2')).toBeNull();
  });
});

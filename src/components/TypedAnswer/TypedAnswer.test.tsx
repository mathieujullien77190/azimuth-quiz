import { render } from '@testing-library/react-native';

import { TypedAnswer } from './TypedAnswer';
import { typedSkeleton } from './helpers';

describe('typedSkeleton', () => {
  it('gives nothing for nothing typed', () => {
    expect(typedSkeleton('')).toEqual([]);
    expect(typedSkeleton('   ')).toEqual([]);
  });

  it('boxes each typed character, uppercase, one group per word, a hyphen as its own slot', () => {
    expect(typedSkeleton(' costa  rica ')).toEqual([
      ['C', 'O', 'S', 'T', 'A'],
      ['R', 'I', 'C', 'A'],
    ]);
    expect(typedSkeleton('a-b')).toEqual([['A', '-', 'B']]);
  });
});

describe('TypedAnswer', () => {
  it('draws every letter and the hyphen, and nothing in an empty slot', async () => {
    const { getByText, getAllByText } = await render(<TypedAnswer groups={[['C', null], ['-', 'A']]} />);
    expect(getByText('C')).toBeTruthy();
    expect(getByText('A')).toBeTruthy();
    expect(getAllByText('-')).toHaveLength(1);
  });

  it('draws nothing without groups', async () => {
    const { toJSON } = await render(<TypedAnswer groups={[]} />);
    expect(toJSON()).toBeNull();
  });
});

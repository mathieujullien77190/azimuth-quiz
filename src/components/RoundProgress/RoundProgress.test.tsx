import { render } from '@testing-library/react-native';

import RoundProgress from '.';

const text = (node: { props: Record<string, any> }) => (node.props.children as unknown[]).join('');

describe('RoundProgress', () => {
  it.each([
    ['easy', 'Facile'],
    ['intermediate', 'Moyen'],
    ['hard', 'Difficile'],
  ] as const)('shows the round and the %s difficulty label', async (difficulty, label) => {
    const { getByText } = await render(<RoundProgress difficulty={difficulty} roundNumber={3} totalRounds={10} />);
    const line = getByText(/Manche/);
    expect(text(line)).toContain('Manche 3 / 10');
    expect(text(line)).toContain(label);
  });
});

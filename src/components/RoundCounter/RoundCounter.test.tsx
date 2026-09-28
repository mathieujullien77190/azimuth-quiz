import { render } from '@testing-library/react-native';

import { LanguageContext } from '@/i18n';

import RoundCounter from '.';

const text = (node: { props: Record<string, unknown> }) => (node.props.children as unknown[]).join('');

describe('RoundCounter', () => {
  it('shows the round and the total', async () => {
    const { getByText } = await render(<RoundCounter roundNumber={3} totalRounds={10} />);
    expect(text(getByText(/Manche/))).toBe('Manche 3 / 10');
  });

  it('speaks English when the language is English', async () => {
    const { getByText } = await render(
      <LanguageContext.Provider
        value={{ language: 'en', ready: true, setLanguage: jest.fn(), resetLanguage: jest.fn() }}
      >
        <RoundCounter roundNumber={1} totalRounds={5} />
      </LanguageContext.Provider>,
    );
    expect(text(getByText(/Round/))).toBe('Round 1 / 5');
  });
});

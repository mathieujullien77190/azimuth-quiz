import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import Section from '.';

describe('Section', () => {
  it('shows its title and its content', async () => {
    const { getByText } = await render(
      <Section title="Difficulté">
        <Text>contenu</Text>
      </Section>,
    );
    expect(getByText('Difficulté')).toBeTruthy();
    expect(getByText('contenu')).toBeTruthy();
  });

  it('shows the hint only when there is one', async () => {
    const { getByText, queryByText, rerender } = await render(
      <Section title="Difficulté">
        <Text>contenu</Text>
      </Section>,
    );
    expect(queryByText('Notoriété du lieu')).toBeNull();

    await rerender(
      <Section hint="Notoriété du lieu" title="Difficulté">
        <Text>contenu</Text>
      </Section>,
    );
    expect(getByText('Notoriété du lieu')).toBeTruthy();
  });
});

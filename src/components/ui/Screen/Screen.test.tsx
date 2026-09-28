import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import Screen from '.';

describe('Screen', () => {
  it('renders children, and header/footer when given', async () => {
    const { getByText } = await render(
      <Screen footer={<Text>Footer</Text>} header={<Text>Header</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });

  it('renders no footer wrapper when none is given', async () => {
    const { queryByText } = await render(
      <Screen>
        <Text>Body</Text>
      </Screen>,
    );
    expect(queryByText('Footer')).toBeNull();
  });

  it('forwards scroll events to the given handler', async () => {
    const onScroll = jest.fn();
    const { getByText } = await render(
      <Screen onScroll={onScroll}>
        <Text>Body</Text>
      </Screen>,
    );
    await fireEvent.scroll(getByText('Body'), { nativeEvent: { contentOffset: { x: 0, y: 40 } } });
    expect(onScroll).toHaveBeenCalledTimes(1);
  });
});

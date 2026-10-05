import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

import VersionLine from '.';

const codename = { emoji: '🐦', name: 'great-tit', wiki: 'https://en.wikipedia.org/wiki/Great_tit' };

describe('VersionLine', () => {
  it('reads "v<version> - <emoji> - <name>" in one line of text', async () => {
    const { getByText } = await render(<VersionLine codename={codename} version="2.65.0" />);
    expect(getByText('v2.65.0 - 🐦 - great-tit')).toBeTruthy();
  });

  it('makes the animal name a link that opens its English Wikipedia article', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByRole } = await render(<VersionLine codename={codename} version="2.65.0" />);
    const link = getByRole('link', { name: 'Wikipedia: great-tit' });
    await fireEvent.press(link);
    expect(openURL).toHaveBeenCalledWith('https://en.wikipedia.org/wiki/Great_tit');
    openURL.mockRestore();
  });

  it('is just the number, with no link, for a version without a codename', async () => {
    const { getByText, queryByRole } = await render(<VersionLine codename={undefined} version="2.65.0" />);
    expect(getByText('v2.65.0')).toBeTruthy();
    expect(queryByRole('link')).toBeNull();
  });

  it('takes the text style of the caller', async () => {
    const { getByText } = await render(
      <VersionLine codename={codename} style={{ textAlign: 'center' }} version="2.65.0" />,
    );
    expect(getByText('v2.65.0 - 🐦 - great-tit').props.style).toEqual({ textAlign: 'center' });
  });
});

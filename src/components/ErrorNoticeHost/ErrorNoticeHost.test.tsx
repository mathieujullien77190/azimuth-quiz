import { act, fireEvent, render } from '@testing-library/react-native';

import { useErrorNotice } from '@/helpers/errorNotice';
import { translations } from '@/i18n/translations';

import { NOTICE_DURATION_MS } from './constants';
import ErrorNoticeHost from '.';

beforeEach(() => {
  jest.useFakeTimers();
  useErrorNotice.setState({ visible: false });
});

afterEach(() => jest.useRealTimers());

describe('ErrorNoticeHost', () => {
  it('shows nothing until a game action fails', async () => {
    const { queryByText } = await render(<ErrorNoticeHost />);
    expect(queryByText(translations.fr.common.actionFailed)).toBeNull();
  });

  it('shows the notice and goes away on tap', async () => {
    const { getByText, queryByText } = await render(<ErrorNoticeHost />);
    await act(async () => useErrorNotice.getState().show());
    await fireEvent.press(getByText(translations.fr.common.actionFailed));
    expect(queryByText(translations.fr.common.actionFailed)).toBeNull();
  });

  it('goes away by itself after a few seconds', async () => {
    const { getByText, queryByText } = await render(<ErrorNoticeHost />);
    await act(async () => useErrorNotice.getState().show());
    expect(getByText(translations.fr.common.actionFailed)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(NOTICE_DURATION_MS);
    });
    expect(queryByText(translations.fr.common.actionFailed)).toBeNull();
  });
});

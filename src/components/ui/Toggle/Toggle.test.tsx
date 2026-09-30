import { fireEvent, render } from '@testing-library/react-native';

import { ThemeSettingsContext } from '@/themes';
import { day } from '@/themes/day';

import { DAY_TRACK_ON_COLOR, NIGHT_THUMB_ON_COLOR } from './constants';
import Toggle from '.';

describe('Toggle', () => {
  it('renders the label without a description when none is given', async () => {
    const { getByText, queryByText } = await render(
      <Toggle label="Live compass" onValueChange={jest.fn()} value={false} />,
    );
    expect(getByText('Live compass')).toBeTruthy();
    expect(queryByText(/./)).toBeTruthy();
  });

  it('renders the description when provided', async () => {
    const { getByText } = await render(
      <Toggle description="Points to true north" label="Live compass" onValueChange={jest.fn()} value={false} />,
    );
    expect(getByText('Points to true north')).toBeTruthy();
  });

  it('calls onValueChange with the new value', async () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = await render(
      <Toggle label="Live compass" onValueChange={onValueChange} value={false} />,
    );
    fireEvent(getByLabelText('Live compass'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('reflects the value being true', async () => {
    const { getByLabelText } = await render(<Toggle label="Live compass" onValueChange={jest.fn()} value={true} />);
    expect(getByLabelText('Live compass').props.value).toBe(true);
  });

  it('uses an orange track and the accent thumb when enabled by day', async () => {
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <Toggle label="Live compass" onValueChange={jest.fn()} value={true} />
      </ThemeSettingsContext.Provider>,
    );
    expect(JSON.stringify(toJSON())).toContain(DAY_TRACK_ON_COLOR);
    expect(JSON.stringify(toJSON())).toContain(day.colors.accent);
  });

  it('uses a deep blue thumb when enabled by night', async () => {
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'night', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <Toggle label="Live compass" onValueChange={jest.fn()} value={true} />
      </ThemeSettingsContext.Provider>,
    );
    expect(JSON.stringify(toJSON())).toContain(NIGHT_THUMB_ON_COLOR);
  });
});

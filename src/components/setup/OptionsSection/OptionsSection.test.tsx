import { fireEvent, render } from '@testing-library/react-native';

import OptionsSection from '.';

describe('OptionsSection', () => {
  const options = [
    { id: 'a', title: 'Option A', description: 'Desc A', value: true, onChange: jest.fn() },
    { id: 'b', title: 'Option B', value: false, onChange: jest.fn() },
    { id: 'c', title: 'Option C', value: false, onChange: jest.fn(), hidden: true },
  ];

  beforeEach(() => jest.clearAllMocks());

  it('lists the visible options and skips hidden ones', async () => {
    const { getByText, queryByText } = await render(<OptionsSection options={options} title="Options" />);
    expect(getByText('Option A')).toBeTruthy();
    expect(getByText('Desc A')).toBeTruthy();
    expect(getByText('Option B')).toBeTruthy();
    expect(queryByText('Option C')).toBeNull();
  });

  it('forwards a toggle to its own option', async () => {
    const { getByLabelText } = await render(<OptionsSection options={options} title="Options" />);
    await fireEvent(getByLabelText('Option B'), 'valueChange', true);
    expect(options[1].onChange).toHaveBeenCalledWith(true);
  });

  it('flags every toggle as disabled when read-only', async () => {
    const { getByLabelText } = await render(<OptionsSection disabled options={options} title="Options" />);
    expect(getByLabelText('Option A').props.accessibilityState.disabled).toBe(true);
  });

  describe('GPS option', () => {
    const gps = (overrides = {}) => ({
      title: 'Ma position',
      description: 'Sinon, un point GPS.',
      useGps: true,
      onToggleUseGps: jest.fn(),
      latitude: 48.85,
      longitude: 2.35,
      onChangeCustomOrigin: jest.fn(),
      ...overrides,
    });

    it('shows the GPS toggle without coordinate fields while GPS is on', async () => {
      const { getByLabelText, queryByText } = await render(<OptionsSection gps={gps()} options={[]} title="Options" />);
      expect(getByLabelText('Ma position').props.value).toBe(true);
      expect(queryByText('Latitude')).toBeNull();
    });

    it('forwards the GPS toggle', async () => {
      const options = gps();
      const { getByLabelText } = await render(<OptionsSection gps={options} options={[]} title="Options" />);
      await fireEvent(getByLabelText('Ma position'), 'valueChange', false);
      expect(options.onToggleUseGps).toHaveBeenCalledWith(false);
    });

    it('shows the custom coordinates once GPS is off, pushing only valid in-range numbers', async () => {
      const options = gps({ useGps: false });
      const { getByDisplayValue } = await render(<OptionsSection gps={options} options={[]} title="Options" />);

      await fireEvent.changeText(getByDisplayValue('48.85'), '10,5');
      expect(options.onChangeCustomOrigin).toHaveBeenLastCalledWith({ customLatitude: 10.5 });
      await fireEvent.changeText(getByDisplayValue('10,5'), '-');
      await fireEvent.changeText(getByDisplayValue('-'), '95');
      expect(options.onChangeCustomOrigin).toHaveBeenCalledTimes(1);

      await fireEvent.changeText(getByDisplayValue('2.35'), '-120');
      expect(options.onChangeCustomOrigin).toHaveBeenLastCalledWith({ customLongitude: -120 });
      await fireEvent.changeText(getByDisplayValue('-120'), '200');
      expect(options.onChangeCustomOrigin).toHaveBeenCalledTimes(2);
    });

    it('locks the coordinate fields when read-only', async () => {
      const { getByDisplayValue } = await render(
        <OptionsSection disabled gps={gps({ useGps: false })} options={[]} title="Options" />,
      );
      expect(getByDisplayValue('48.85').props.editable).toBe(false);
    });

    it('re-seeds the coordinate fields once the persisted settings are ready', async () => {
      const { getByDisplayValue, rerender } = await render(
        <OptionsSection gps={gps({ useGps: false, ready: false, latitude: 1 })} options={[]} title="Options" />,
      );
      expect(getByDisplayValue('1')).toBeTruthy();
      await rerender(
        <OptionsSection gps={gps({ useGps: false, ready: true, latitude: 40 })} options={[]} title="Options" />,
      );
      expect(getByDisplayValue('40')).toBeTruthy();
    });
  });
});

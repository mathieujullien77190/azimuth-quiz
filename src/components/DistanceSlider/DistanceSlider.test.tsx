import { fireEvent, render } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import { MIN_DISTANCE_KM } from '@/constants';
import { formatDistance } from '@/helpers';

import DistanceSlider from '.';

type PanResponderConfig = Parameters<typeof PanResponder.create>[0];

describe('DistanceSlider', () => {
  it('shows the "Distance estimée" label and the formatted current value', async () => {
    const { getByLabelText, getByText } = await render(<DistanceSlider maxKm={20000} onChange={jest.fn()} valueKm={1500} />);
    expect(getByLabelText('Distance estimée')).toBeTruthy();
    expect(getByText(formatDistance(1500))).toBeTruthy();
  });

  it('only shows marks below maxKm', async () => {
    const { getByText, queryByText } = await render(<DistanceSlider maxKm={5000} onChange={jest.fn()} valueKm={1000} />);
    expect(getByText(formatDistance(100))).toBeTruthy();
    expect(queryByText(formatDistance(10000))).toBeNull();
  });

  it('converts a touch position back to a km value via onChange', async () => {
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { getByLabelText } = await render(<DistanceSlider maxKm={20000} onChange={onChange} valueKm={1000} />);
    const track = getByLabelText('Distance estimée');
    await fireEvent(track, 'layout', { nativeEvent: { layout: { width: 300, height: 48, x: 0, y: 0 } } });

    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    config.onPanResponderGrant?.({ nativeEvent: { locationX: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(MIN_DISTANCE_KM);
  });
});

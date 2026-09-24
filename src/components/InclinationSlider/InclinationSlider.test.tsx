import { fireEvent, render } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import { MIN_DISTANCE_KM } from '@/constants';
import { formatInclination, inclinationFromChordKm } from '@/helpers';

import InclinationSlider from '.';

type PanResponderConfig = Parameters<typeof PanResponder.create>[0];

describe('InclinationSlider', () => {
  it('shows the "Inclinaison" label and the inclination derived from the straight-line distance', async () => {
    const { getByLabelText, getByText } = await render(<InclinationSlider distanceKm={3000} maxKm={12742} onChange={jest.fn()} />);
    expect(getByLabelText('Inclinaison')).toBeTruthy();
    expect(getByText(formatInclination(inclinationFromChordKm(3000)))).toBeTruthy();
  });

  it('never shows a distance value (only degrees), unlike DistanceSlider', async () => {
    const { queryByText } = await render(<InclinationSlider distanceKm={3000} maxKm={12742} onChange={jest.fn()} />);
    expect(queryByText(/km/)).toBeNull();
  });

  it('converts a touch position back to a straight-line km value via onChange', async () => {
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { getByLabelText } = await render(<InclinationSlider distanceKm={3000} maxKm={12742} onChange={onChange} />);
    const track = getByLabelText('Inclinaison');
    await fireEvent(track, 'layout', { nativeEvent: { layout: { width: 300, height: 48, x: 0, y: 0 } } });

    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    config.onPanResponderGrant?.({ nativeEvent: { locationX: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(MIN_DISTANCE_KM);
  });
});

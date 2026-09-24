import { fireEvent, render } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import SliderTrack from '.';
import type { SliderMark } from './types';

type PanResponderConfig = Parameters<typeof PanResponder.create>[0];

const marks: SliderMark[] = [
  { ratio: 0, label: '0 km' },
  { ratio: 1, label: '1000 km' },
];

describe('SliderTrack — content', () => {
  it('shows the label and value', async () => {
    const { getByText } = await render(
      <SliderTrack label="Distance" marks={[]} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    expect(getByText('Distance')).toBeTruthy();
    expect(getByText('500 km')).toBeTruthy();
  });

  it('shows an optional caption when provided', async () => {
    const { getByText, queryByText } = await render(
      <SliderTrack caption="Ligne droite" label="Distance" marks={[]} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    expect(getByText('Ligne droite')).toBeTruthy();

    const { queryByText: queryByTextNoCaption } = await render(
      <SliderTrack label="Distance" marks={[]} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    expect(queryByTextNoCaption('Ligne droite')).toBeNull();
    expect(queryByText('Ligne droite')).toBeTruthy();
  });

  it('renders every mark label', async () => {
    const { getByText } = await render(
      <SliderTrack label="Distance" marks={marks} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    expect(getByText('0 km')).toBeTruthy();
    expect(getByText('1000 km')).toBeTruthy();
  });

  it('exposes accessibility props for the touch area', async () => {
    const { getByLabelText } = await render(
      <SliderTrack label="Distance" marks={marks} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    const track = getByLabelText('Distance');
    expect(track.props.accessibilityRole).toBe('adjustable');
    expect(track.props.accessibilityValue).toEqual({ text: '500 km' });
  });

  it('updates the tracked width on layout', async () => {
    const { getByLabelText } = await render(
      <SliderTrack label="Distance" marks={marks} onRatioChange={jest.fn()} ratio={0.5} valueText="500 km" />,
    );
    const track = getByLabelText('Distance');
    fireEvent(track, 'layout', { nativeEvent: { layout: { width: 300, height: 48, x: 0, y: 0 } } });
    expect(track).toBeTruthy();
  });
});

describe('SliderTrack — gesture', () => {
  it('reports a ratio derived from the touch position on grant and on move', async () => {
    const onRatioChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { getByLabelText } = await render(
      <SliderTrack label="Distance" marks={marks} onRatioChange={onRatioChange} ratio={0} valueText="0 km" />,
    );
    const track = getByLabelText('Distance');
    fireEvent(track, 'layout', { nativeEvent: { layout: { width: 300, height: 48, x: 0, y: 0 } } });

    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponderCapture?.({} as never, {} as never)).toBe(true);
    expect(config.onPanResponderTerminationRequest?.({} as never, {} as never)).toBe(false);
    expect(config.onShouldBlockNativeResponder?.({} as never, {} as never)).toBe(true);

    config.onPanResponderGrant?.({ nativeEvent: { locationX: 0 } } as never, {} as never);
    expect(onRatioChange).toHaveBeenLastCalledWith(0);

    config.onPanResponderMove?.({ nativeEvent: { locationX: 285 } } as never, {} as never);
    expect(onRatioChange).toHaveBeenLastCalledWith(1);
  });

  it('always uses the latest onRatioChange, even after a re-render with a new callback', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { getByLabelText, rerender } = await render(
      <SliderTrack label="Distance" marks={marks} onRatioChange={first} ratio={0} valueText="0 km" />,
    );
    await rerender(<SliderTrack label="Distance" marks={marks} onRatioChange={second} ratio={0} valueText="0 km" />);

    const track = getByLabelText('Distance');
    fireEvent(track, 'layout', { nativeEvent: { layout: { width: 300, height: 48, x: 0, y: 0 } } });
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    config.onPanResponderGrant?.({ nativeEvent: { locationX: 0 } } as never, {} as never);

    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });
});

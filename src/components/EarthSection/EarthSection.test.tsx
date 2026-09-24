import { act, fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { EARTH_RADIUS_KM } from '@/constants';
import { ThemeSettingsContext } from '@/themes';

import { DAY_ORBIT_EMOJI, SATELLITE_ORBIT_MS, SATELLITE_QUIP, ZOOM_STEPS } from './constants';
import EarthSection from '.';
import type { EarthMark } from './types';

// A nearby mark: the ideal zoom climbs well above 1 (lots of room available relative
// to a very small offset), to exercise the +/- buttons without having to click them first.
const nearMark: EarthMark = { bearing: 90, distanceKm: 5, color: '#EF4444' };
// A very far mark (the other side of the Earth): forces the ideal zoom back down to 1, the only
// tier where the satellite can appear.
const farMark: EarthMark = { bearing: 90, distanceKm: EARTH_RADIUS_KM * Math.PI, color: '#16A34A' };

describe('EarthSection — marks rendering', () => {
  it('renders without the straight-line chord or zoom controls by default', async () => {
    const { queryByText } = await render(<EarthSection marks={[nearMark]} showStraightLine={false} size={240} />);
    expect(queryByText('horizon')).toBeNull();
    // No zoomControls -> no +/- buttons.
    expect(queryByText('−')).toBeNull();
    expect(queryByText('+')).toBeNull();
  });

  it('shows the horizon line/label and caption in straight-line mode', async () => {
    const { getByText, toJSON } = await render(<EarthSection marks={[nearMark]} showStraightLine size={240} />);
    expect(getByText('COUPE DE LA TERRE')).toBeTruthy();
    // The "horizon" label is SVG text (RNSVGText/TSpan), not matchable by getByText: we
    // check its presence directly in the rendered tree.
    expect(JSON.stringify(toJSON())).toContain('horizon');
  });

  it('shows the surface caption when not in straight-line mode', async () => {
    const { getByText } = await render(<EarthSection marks={[nearMark]} showStraightLine={false} size={240} />);
    expect(getByText('LA TERRE')).toBeTruthy();
  });

  it('renders a truth mark distinctly (ring, no arc/chord) without crashing', async () => {
    const truthMark: EarthMark = { ...nearMark, isTruth: true };
    const { toJSON } = await render(<EarthSection marks={[truthMark]} showStraightLine size={240} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('EarthSection — zoom controls', () => {
  it('starts at the ideal zoom, − decreases and can reach the disabled minimum', async () => {
    const { getAllByRole } = await render(
      <EarthSection marks={[nearMark]} showStraightLine={false} size={240} zoomControls />,
    );
    const [minus] = getAllByRole('button');
    for (let i = 0; i < ZOOM_STEPS.length; i += 1) {
      await fireEvent.press(minus);
    }
    expect(minus.props.accessibilityState.disabled).toBe(true);
  });

  it('+ increases zoom and can reach the disabled maximum', async () => {
    const { getAllByRole } = await render(
      <EarthSection marks={[nearMark]} showStraightLine={false} size={240} zoomControls />,
    );
    const [, plus] = getAllByRole('button');
    for (let i = 0; i < ZOOM_STEPS.length; i += 1) {
      await fireEvent.press(plus);
    }
    expect(plus.props.accessibilityState.disabled).toBe(true);
  });

  it('using a far mark (ideal zoom at the minimum), + starts enabled and increases the zoom', async () => {
    const { getAllByRole } = await render(
      <EarthSection marks={[farMark]} showStraightLine={false} size={240} zoomControls />,
    );
    const [minus, plus] = getAllByRole('button');
    expect(minus.props.accessibilityState.disabled).toBe(true);
    expect(plus.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(plus);
    expect(minus.props.accessibilityState.disabled).toBe(false);
  });
});

describe('EarthSection — satellite', () => {
  const startMock = jest.fn();
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    startMock.mockClear();
    timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockReturnValue({ start: startMock, stop: jest.fn() } as unknown as Animated.CompositeAnimation);
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  it('does not show the satellite when allowSatellite is false', async () => {
    const { queryByText } = await render(
      <EarthSection allowSatellite={false} marks={[farMark]} showStraightLine={false} size={240} />,
    );
    expect(queryByText('🛰️')).toBeNull();
    expect(startMock).not.toHaveBeenCalled();
  });

  it('does not show the satellite when zoomed in past scale 1, even if allowed', async () => {
    const { queryByText } = await render(
      <EarthSection allowSatellite marks={[nearMark]} showStraightLine={false} size={240} />,
    );
    expect(queryByText('🛰️')).toBeNull();
  });

  it('shows the satellite at zoom 1 with allowSatellite, and loops the orbit animation', async () => {
    const { getByText } = await render(<EarthSection allowSatellite marks={[farMark]} showStraightLine={false} size={240} />);
    expect(getByText('🛰️')).toBeTruthy();
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: SATELLITE_ORBIT_MS, toValue: 1, useNativeDriver: true }),
    );
    expect(startMock).toHaveBeenCalledTimes(1);

    // Simulates the (natural) end of the first turn: the manual loop must restart a timing.
    const onFinished = startMock.mock.calls[0][0] as (result: { finished: boolean }) => void;
    await act(() => onFinished({ finished: true }));
    expect(startMock).toHaveBeenCalledTimes(2);

    // A "not finished" (interrupted) callback must not restart the loop.
    const onFinished2 = startMock.mock.calls[1][0] as (result: { finished: boolean }) => void;
    await act(() => onFinished2({ finished: false }));
    expect(startMock).toHaveBeenCalledTimes(2);
  });

  it('stops looping after unmount even if the in-flight animation reports finished', async () => {
    const { unmount, getByText } = await render(
      <EarthSection allowSatellite marks={[farMark]} showStraightLine={false} size={240} />,
    );
    getByText('🛰️');
    const callsBeforeUnmount = startMock.mock.calls.length;
    const onFinished = startMock.mock.calls[callsBeforeUnmount - 1][0] as (result: { finished: boolean }) => void;
    await unmount();
    await act(() => onFinished({ finished: true }));
    // `cancelled` prevents any new spin() after unmount.
    expect(startMock).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('shows a plane instead of the satellite by day', async () => {
    const { getByText, queryByText } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <EarthSection allowSatellite marks={[farMark]} showStraightLine={false} size={240} />
      </ThemeSettingsContext.Provider>,
    );
    expect(getByText(DAY_ORBIT_EMOJI)).toBeTruthy();
    expect(queryByText('🛰️')).toBeNull();
  });

  it('toggles the joke bubble on tap and hides it again on a second tap', async () => {
    const { getByText, queryByText } = await render(
      <EarthSection allowSatellite marks={[farMark]} showStraightLine={false} size={240} />,
    );
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
    await fireEvent.press(getByText('🛰️'));
    expect(getByText(SATELLITE_QUIP)).toBeTruthy();
    await fireEvent.press(getByText('🛰️'));
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
  });
});

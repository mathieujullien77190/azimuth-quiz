import { act, fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { EARTH_RADIUS_KM } from '@/data';
import { USE_NATIVE_DRIVER } from '@/helpers';
import { ThemeSettingsContext } from '@/themes';

import { CAPTION_GLOBE, RESET_HINT, ZOOM_IN_HINT } from '@/components/geo/Globe3D/constants';

import {
  CAPTION_SURFACE,
  SATELLITE_ORBIT_MS,
  SATELLITE_QUIP,
  SWITCH_TO_EARTH,
  SWITCH_TO_GLOBE,
  ZOOM_STEPS,
} from '../constants';
import EarthSection from '..';
import type { EarthMark } from '../types';

// Repere proche : le zoom ideal depasse 1, pour tester +/- sans cliquer.
const nearMark: EarthMark = { bearing: 90, distanceKm: 5, color: '#EF4444' };
// Repere tres lointain : zoom ideal ramene a 1, seul palier ou le satellite apparait.
const farMark: EarthMark = { bearing: 90, distanceKm: EARTH_RADIUS_KM * Math.PI, color: '#16A34A' };

describe('EarthSection — marks rendering', () => {
  it('renders without zoom controls by default', async () => {
    const { queryByText } = await render(<EarthSection marks={[nearMark]} size={240} />);
    // Sans zoomControls : pas de boutons +/-.
    expect(queryByText('−')).toBeNull();
    expect(queryByText('+')).toBeNull();
  });

  it('shows the surface caption', async () => {
    const { getByText } = await render(<EarthSection marks={[nearMark]} size={240} />);
    expect(getByText('LA TERRE')).toBeTruthy();
  });

  it('renders a truth mark distinctly (ring, no arc) without crashing', async () => {
    const truthMark: EarthMark = { ...nearMark, isTruth: true };
    const { toJSON } = await render(<EarthSection marks={[truthMark]} size={240} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('EarthSection — zoom controls', () => {
  it('starts at the ideal zoom, − decreases and can reach the disabled minimum', async () => {
    const { getAllByRole } = await render(<EarthSection marks={[nearMark]} size={240} zoomControls />);
    const [minus] = getAllByRole('button');
    for (let i = 0; i < ZOOM_STEPS.length; i += 1) {
      await fireEvent.press(minus);
    }
    expect(minus.props.accessibilityState.disabled).toBe(true);
  });

  it('+ increases zoom and can reach the disabled maximum', async () => {
    const { getAllByRole } = await render(<EarthSection marks={[nearMark]} size={240} zoomControls />);
    const [, plus] = getAllByRole('button');
    for (let i = 0; i < ZOOM_STEPS.length; i += 1) {
      await fireEvent.press(plus);
    }
    expect(plus.props.accessibilityState.disabled).toBe(true);
  });

  it('using a far mark (ideal zoom at the minimum), + starts enabled and increases the zoom', async () => {
    const { getAllByRole } = await render(<EarthSection marks={[farMark]} size={240} zoomControls />);
    const [minus, plus] = getAllByRole('button');
    expect(minus.props.accessibilityState.disabled).toBe(true);
    expect(plus.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(plus);
    expect(minus.props.accessibilityState.disabled).toBe(false);
  });
});

const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('EarthSection — 3D globe', () => {
  it('shows the globe first, with a switch to the 2D Earth, whatever the zoom, but only with a starting point', async () => {
    const far = await render(<EarthSection marks={[farMark]} origin={PARIS} size={240} />);
    expect(far.getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    expect(far.getByText(SWITCH_TO_EARTH)).toBeTruthy();
    await far.unmount();
    const near = await render(<EarthSection marks={[nearMark]} origin={PARIS} size={240} />);
    expect(near.getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    await near.unmount();
    const noOrigin = await render(<EarthSection marks={[farMark]} size={240} />);
    expect(noOrigin.queryByText(SWITCH_TO_GLOBE)).toBeNull();
    expect(noOrigin.queryByText(SWITCH_TO_EARTH)).toBeNull();
    expect(noOrigin.getByLabelText(CAPTION_SURFACE)).toBeTruthy();
  });

  it('switches to the 2D Earth and back to the globe', async () => {
    const { getByText, getByLabelText, queryByLabelText } = await render(
      <EarthSection marks={[farMark]} origin={PARIS} size={240} />,
    );
    await fireEvent.press(getByText(SWITCH_TO_EARTH));
    expect(getByLabelText(CAPTION_SURFACE)).toBeTruthy();
    expect(queryByLabelText(CAPTION_GLOBE)).toBeNull();
    await fireEvent.press(getByText(SWITCH_TO_GLOBE));
    expect(getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    expect(queryByLabelText(CAPTION_SURFACE)).toBeNull();
  });

  it('leaves the zooming to the globe, and takes it back with the 2D Earth', async () => {
    const { getByLabelText, getByText, queryByLabelText, queryByText } = await render(
      <EarthSection marks={[farMark]} origin={PARIS} size={240} zoomControls />,
    );
    // Le globe zoome seul (et se remet au nord), en continu : pas par paliers.
    expect(getByLabelText(ZOOM_IN_HINT)).toBeTruthy();
    expect(getByLabelText(RESET_HINT)).toBeTruthy();

    await fireEvent.press(getByText(SWITCH_TO_EARTH));
    expect(queryByLabelText(ZOOM_IN_HINT)).toBeNull();
    expect(queryByLabelText(RESET_HINT)).toBeNull();
    expect(queryByText('+')).toBeTruthy();
    expect(queryByText('−')).toBeTruthy();
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

  it('does not show the satellite without zoom controls', async () => {
    const { queryByText } = await render(<EarthSection marks={[farMark]} size={240} />);
    expect(queryByText('🛰️')).toBeNull();
    expect(startMock).not.toHaveBeenCalled();
  });

  it('does not show the satellite when zoomed in past scale 1, even with zoom controls', async () => {
    const { queryByText } = await render(<EarthSection zoomControls marks={[nearMark]} size={240} />);
    expect(queryByText('🛰️')).toBeNull();
  });

  it('shows the satellite at zoom 1 with zoom controls, and loops the orbit animation', async () => {
    const { getByText } = await render(<EarthSection zoomControls marks={[farMark]} size={240} />);
    expect(getByText('🛰️')).toBeTruthy();
    expect(timingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: SATELLITE_ORBIT_MS, toValue: 1, useNativeDriver: USE_NATIVE_DRIVER }),
    );
    expect(startMock).toHaveBeenCalledTimes(1);

    // Fin naturelle du 1er tour : la boucle manuelle doit relancer un timing.
    const onFinished = startMock.mock.calls[0][0] as (result: { finished: boolean }) => void;
    await act(() => onFinished({ finished: true }));
    expect(startMock).toHaveBeenCalledTimes(2);

    // Un callback "non termine" (interrompu) ne doit pas relancer la boucle.
    const onFinished2 = startMock.mock.calls[1][0] as (result: { finished: boolean }) => void;
    await act(() => onFinished2({ finished: false }));
    expect(startMock).toHaveBeenCalledTimes(2);
  });

  it('stops looping after unmount even if the in-flight animation reports finished', async () => {
    const { unmount, getByText } = await render(<EarthSection zoomControls marks={[farMark]} size={240} />);
    getByText('🛰️');
    const callsBeforeUnmount = startMock.mock.calls.length;
    const onFinished = startMock.mock.calls[callsBeforeUnmount - 1][0] as (result: { finished: boolean }) => void;
    await unmount();
    await act(() => onFinished({ finished: true }));
    // `cancelled` empeche tout nouveau spin() apres le demontage.
    expect(startMock).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('has no satellite, nor plane, by day', async () => {
    const { queryByText } = await render(
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'day',
          ready: true,
          setThemeId: jest.fn(),
          resetThemeId: jest.fn(),
        }}
      >
        <EarthSection zoomControls marks={[farMark]} size={240} />
      </ThemeSettingsContext.Provider>,
    );
    expect(queryByText('🛰️')).toBeNull();
    expect(queryByText('✈️')).toBeNull();
  });

  it('toggles the joke bubble on tap and hides it again on a second tap', async () => {
    const { getByText, queryByText } = await render(<EarthSection zoomControls marks={[farMark]} size={240} />);
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
    await fireEvent.press(getByText('🛰️'));
    expect(getByText(SATELLITE_QUIP)).toBeTruthy();
    await fireEvent.press(getByText('🛰️'));
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
  });
});

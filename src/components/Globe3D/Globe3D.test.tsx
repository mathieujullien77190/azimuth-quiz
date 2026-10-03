import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import type { EarthMark } from '@/components/EarthSection';

import { PLAYER_LABEL, SATELLITE_QUIP } from '@/components/EarthSection/constants';
import { ThemeSettingsContext } from '@/themes';

import { CAPTION_GLOBE, ORBIT_MS, RESET_HINT, ZOOM_IN_HINT, ZOOM_OUT_HINT } from './constants';
import Globe3D from '.';

// The OpenGL surface, and the graphics card behind it: the globe is drawn for real everywhere else (see `scene.test.ts`),
// here only what the component asks of the surface matters.
jest.mock('expo-gl', () => {
  /* eslint-disable @typescript-eslint/no-require-imports -- a jest.mock factory runs before the imports it would use */
  const React = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const context = { drawingBufferWidth: 240, drawingBufferHeight: 240, endFrameEXP: jest.fn() };
  return {
    __context: context,
    GLView: ({ onContextCreate, ...props }: { onContextCreate: (gl: unknown) => void }) => {
      // The surface arrives just after the first drawing, as on a device.
      React.useEffect(() => onContextCreate(context), [onContextCreate]);
      return React.createElement(View, props);
    },
  };
});

jest.mock('./renderer', () => {
  const renderer = {
    render: jest.fn(),
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    dispose: jest.fn(),
  };
  return { __renderer: renderer, createRenderer: jest.fn(() => renderer) };
});

const { __context: gl } = jest.requireMock('expo-gl');
const { __renderer: renderer } = jest.requireMock('./renderer');

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const answer: EarthMark = { bearing: 261.4, distanceKm: 6079, color: '#EF4444' };

type PanConfig = Parameters<typeof PanResponder.create>[0];
/** A one-finger move of the gesture (no pinch). */
const oneFinger = { nativeEvent: { touches: [{ pageX: 0, pageY: 0 }] } } as never;
const pinch = (gap: number) =>
  ({ nativeEvent: { touches: [{ pageX: 0, pageY: 0 }, { pageX: 0, pageY: gap }] } }) as never;

/** Renders the globe and hands over the touch handlers it just set up. */
const renderGlobe = async (props: Partial<React.ComponentProps<typeof Globe3D>> = {}) => {
  const createSpy = jest.spyOn(PanResponder, 'create');
  const screen = await render(<Globe3D marks={[answer]} origin={PARIS} size={240} {...props} />);
  const config =
    createSpy.mock.calls.length === 0 ? undefined : (createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanConfig);
  createSpy.mockRestore();
  return { ...screen, config: config as PanConfig };
};

beforeEach(() => jest.clearAllMocks());

describe('Globe3D', () => {
  it('draws the globe once the surface is there, and labels the starting point and the pole', async () => {
    const { getByLabelText, queryByText } = await renderGlobe();
    expect(getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
    expect(queryByText('N')).toBeTruthy();
    expect(renderer.render).toHaveBeenCalled();
    expect(gl.endFrameEXP).toHaveBeenCalled();
  });

  it('draws nothing more while nothing changes', async () => {
    await renderGlobe();
    const drawings = renderer.render.mock.calls.length;
    await act(async () => {});
    expect(renderer.render.mock.calls.length).toBe(drawings);
  });

  it('hands the graphics card back on the way out', async () => {
    const { unmount } = await renderGlobe();
    await unmount();
    expect(renderer.dispose).toHaveBeenCalled();
  });

  it('can be left without a pole, and without answers', async () => {
    const { queryByText } = await renderGlobe({ marks: [], north: false });
    expect(queryByText('N')).toBeNull();
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });
});

describe('Globe3D — turning it with a finger', () => {
  it('asks for the touches and keeps them once it has them', async () => {
    const { config } = await renderGlobe();
    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onPanResponderTerminationRequest?.({} as never, {} as never)).toBe(false);
  });

  it('turns until the starting point and the pole are behind the globe, and draws it again', async () => {
    const { config, queryByText } = await renderGlobe({ marks: [{ ...answer, isTruth: true }] });
    const drawings = renderer.render.mock.calls.length;

    await act(() => config.onPanResponderGrant?.(oneFinger, {} as never));
    // Moves are cumulative within a gesture: the second one only adds what is new since the first.
    await act(() => config.onPanResponderMove?.(oneFinger, { dx: 10, dy: -1000 } as never));
    await act(() => config.onPanResponderMove?.(oneFinger, { dx: 20, dy: -2000 } as never));
    expect(queryByText(PLAYER_LABEL)).toBeNull();
    expect(queryByText('N')).toBeNull();
    expect(renderer.render.mock.calls.length).toBeGreaterThan(drawings);

    // A new gesture starts from zero again: tipping the other way brings the starting point back.
    await act(() => config.onPanResponderGrant?.(oneFinger, {} as never));
    await act(() => config.onPanResponderMove?.(oneFinger, { dx: 0, dy: 4000 } as never));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });

  it('has no touch handlers at all when it cannot be turned', async () => {
    const fixed = await render(<Globe3D draggable={false} marks={[]} origin={PARIS} size={240} />);
    const turnable = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    const handlers = (tree: unknown) => (tree as { props: Record<string, unknown> }).props.onStartShouldSetResponder;
    expect(handlers(fixed.toJSON())).toBeUndefined();
    expect(handlers(turnable.toJSON())).toBeDefined();
  });
});

describe('Globe3D — zooming', () => {
  /** The satellite only flies over the unzoomed globe: it says whether the zoom moved. */
  const zoomed = (queryByText: (text: string) => unknown) => queryByText('🛰️') === null;

  it('zooms in and out with two fingers', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(pinch(100), {} as never));
    await act(() => config.onPanResponderMove?.(pinch(100), { dx: 0, dy: 0 } as never));
    // The first move only tells how far apart the fingers are; the next one is what spreads them.
    expect(zoomed(queryByText)).toBe(false);
    await act(() => config.onPanResponderMove?.(pinch(300), { dx: 0, dy: 0 } as never));
    expect(zoomed(queryByText)).toBe(true);

    await act(() => config.onPanResponderMove?.(pinch(50), { dx: 0, dy: 0 } as never));
    expect(zoomed(queryByText)).toBe(false);
  });

  it('does not jump when a pinch goes back to a single finger', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(pinch(100), {} as never));
    await act(() => config.onPanResponderMove?.(pinch(100), { dx: 200, dy: 0 } as never));
    // Only the fingers spreading counted so far: lifting one and carrying on turns from there, not from the start.
    await act(() => config.onPanResponderMove?.(oneFinger, { dx: 200, dy: 0 } as never));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });

  it('zooms with the buttons, and the ⌖ N button puts the globe back where it started', async () => {
    const { config, getByLabelText, queryByText } = await renderGlobe();
    await fireEvent.press(getByLabelText(ZOOM_IN_HINT));
    expect(zoomed(queryByText)).toBe(true);
    await fireEvent.press(getByLabelText(ZOOM_OUT_HINT));
    expect(zoomed(queryByText)).toBe(false);

    await act(() => config.onPanResponderGrant?.(oneFinger, {} as never));
    await act(() => config.onPanResponderMove?.(oneFinger, { dx: 0, dy: -2000 } as never));
    await fireEvent.press(getByLabelText(ZOOM_IN_HINT));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    await fireEvent.press(getByLabelText(RESET_HINT));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
    expect(zoomed(queryByText)).toBe(false);
  });

  it('has no buttons when the globe is fixed', async () => {
    const { queryByLabelText } = await renderGlobe({ draggable: false });
    expect(queryByLabelText(ZOOM_IN_HINT)).toBeNull();
    expect(queryByLabelText(RESET_HINT)).toBeNull();
  });

  it('can be turned without the buttons', async () => {
    const { queryByLabelText, config } = await renderGlobe({ controls: false });
    expect(queryByLabelText(ZOOM_IN_HINT)).toBeNull();
    expect(config).toBeDefined();
  });
});

describe('Globe3D — satellite', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('flies over the starting point, goes behind the globe and comes back', async () => {
    const { queryByText } = await renderGlobe();
    expect(queryByText('🛰️')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 2));
    expect(queryByText('🛰️')).toBeNull();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 2));
    expect(queryByText('🛰️')).toBeTruthy();
  });

  it('shows a joke when the satellite is tapped, and hides it on a second tap', async () => {
    const { getByText, queryByText } = await renderGlobe();
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
    await fireEvent.press(getByText('🛰️'));
    expect(getByText(SATELLITE_QUIP)).toBeTruthy();
    await fireEvent.press(getByText('🛰️'));
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
  });

  it('follows the true answer when there is one', async () => {
    const marks: EarthMark[] = [answer, { ...answer, bearing: 90, isTruth: true }];
    const { queryByText } = await renderGlobe({ marks });
    expect(queryByText('🛰️')).toBeTruthy();
  });

  it('has none when asked not to, and none without an answer to follow', async () => {
    const asked = await renderGlobe({ satellite: false });
    expect(asked.queryByText('🛰️')).toBeNull();
    const empty = await renderGlobe({ marks: [] });
    expect(empty.queryByText('🛰️')).toBeNull();
  });

  it('has no satellite, nor plane, by day', async () => {
    const { queryByText } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn() }}
      >
        <Globe3D marks={[answer]} origin={PARIS} size={240} />
      </ThemeSettingsContext.Provider>,
    );
    expect(queryByText('🛰️')).toBeNull();
    expect(queryByText('✈️')).toBeNull();
  });
});

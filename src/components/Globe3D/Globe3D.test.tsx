import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder, Platform } from 'react-native';

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
/** One finger, at that place on the screen. */
const finger = (x: number, y: number) =>
  ({ nativeEvent: { pageX: x, pageY: y, touches: [{ pageX: x, pageY: y }] } }) as never;
/** Two fingers, that far apart. */
const pinch = (gap: number) =>
  ({
    nativeEvent: { pageX: 0, pageY: 0, touches: [{ pageX: 0, pageY: 0 }, { pageX: 0, pageY: gap }] },
  }) as never;
/** How many fingers the gesture says are on the glass; 0 = a stray move once they are gone. */
const touching = (count: number) => ({ numberActiveTouches: count }) as never;

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

    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    // Each move is the step since the previous one, so the globe follows the finger without adding it up twice.
    await act(() => config.onPanResponderMove?.(finger(10, -1000), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(20, -2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();
    expect(queryByText('N')).toBeNull();
    expect(renderer.render.mock.calls.length).toBeGreaterThan(drawings);

    // Tipping the other way brings the starting point back.
    await act(() => config.onPanResponderMove?.(finger(20, 2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });

  it('starts a new turn from where the finger lands, and ignores a move once the finger is gone', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(0, -2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // Letting go, then touching down far from there: the globe must not jump by the gap between the two places.
    await act(() => config.onPanResponderRelease?.(finger(0, -2000), touching(0)));
    await act(() => config.onPanResponderGrant?.(finger(0, 500), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(0, 510), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // The web reports one last move once the finger is already gone: it used to send the globe back where it started.
    await act(() => config.onPanResponderMove?.(finger(0, 4000), touching(0)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // A gesture cut short (a scroll taking over) leaves nothing behind either.
    await act(() => config.onPanResponderTerminate?.(finger(0, 510), touching(0)));
    await act(() => config.onPanResponderMove?.(finger(0, 9000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();
  });

  it('keeps the gesture to itself, so the page does not scroll under the finger', async () => {
    const { config } = await renderGlobe();
    expect(config.onShouldBlockNativeResponder?.({} as never, {} as never)).toBe(true);
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
    await act(() => config.onPanResponderGrant?.(pinch(100), touching(2)));
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    // Fingers that have not moved apart yet change nothing.
    expect(zoomed(queryByText)).toBe(false);
    await act(() => config.onPanResponderMove?.(pinch(300), touching(2)));
    expect(zoomed(queryByText)).toBe(true);

    await act(() => config.onPanResponderMove?.(pinch(50), touching(2)));
    expect(zoomed(queryByText)).toBe(false);
  });

  it('only measures the gap on the move a second finger lands, then zooms', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    // Nothing to compare that first gap with: the zoom must not jump the moment the second finger touches down.
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    expect(zoomed(queryByText)).toBe(false);
    await act(() => config.onPanResponderMove?.(pinch(300), touching(2)));
    expect(zoomed(queryByText)).toBe(true);
  });

  it('does not jump when a pinch goes back to a single finger', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(pinch(100), touching(2)));
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    // Only the fingers spreading counted so far: lifting one and carrying on turns from where the last one is.
    await act(() => config.onPanResponderMove?.(finger(0, 0), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });

  it('zooms with the buttons, and the ⌖ N button puts the globe back where it started', async () => {
    const { config, getByLabelText, queryByText } = await renderGlobe();
    await fireEvent.press(getByLabelText(ZOOM_IN_HINT));
    expect(zoomed(queryByText)).toBe(true);
    await fireEvent.press(getByLabelText(ZOOM_OUT_HINT));
    expect(zoomed(queryByText)).toBe(false);

    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(0, -2000), touching(1)));
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

describe('Globe3D — on the web', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  const styleOf = (tree: unknown) => JSON.stringify((tree as { props: { style: unknown } }).props.style);

  it('keeps the page from scrolling under the finger that turns the globe', async () => {
    Platform.OS = 'web';
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    expect(styleOf(toJSON())).toContain('touchAction');
  });

  it('has nothing of the sort on a phone, where there is no page to scroll', async () => {
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    expect(styleOf(toJSON())).not.toContain('touchAction');
  });
});

describe('Globe3D — satellite', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('flies over the ball, goes behind it and comes back', async () => {
    const { queryByText } = await renderGlobe();
    expect(queryByText('🛰️')).toBeTruthy();
    // A quarter of the way round it is over the ball, three quarters of the way it is behind it.
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 4));
    expect(queryByText('🛰️')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 2));
    expect(queryByText('🛰️')).toBeNull();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 4));
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

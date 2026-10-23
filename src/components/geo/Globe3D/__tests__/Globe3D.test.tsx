import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder, Platform } from 'react-native';

import type { EarthMark } from '@/components/geo/EarthSection';

import { PLAYER_LABEL, SATELLITE_QUIP } from '@/components/geo/EarthSection/constants';
import { ThemeSettingsContext } from '@/themes';

import { CAPTION_GLOBE, ORBIT_MS, RESET_HINT, ZOOM_IN_HINT, ZOOM_OUT_HINT, ZOOM_STEP } from '../constants';
import Globe3D from '..';

// Surface OpenGL et carte graphique derriere : le globe est dessine pour de vrai ailleurs (voir `scene.test.ts`),
// ici seul compte ce que le composant demande a la surface.
jest.mock('expo-gl', () => {
  /* eslint-disable @typescript-eslint/no-require-imports -- a jest.mock factory runs before the imports it would use */
  const React = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const context = { drawingBufferWidth: 240, drawingBufferHeight: 240, endFrameEXP: jest.fn() };
  return {
    __context: context,
    GLView: ({ onContextCreate, ...props }: { onContextCreate: (gl: unknown) => void }) => {
      // La surface arrive juste apres le premier dessin, comme sur un appareil.
      React.useEffect(() => onContextCreate(context), [onContextCreate]);
      return React.createElement(View, props);
    },
  };
});

jest.mock('../renderer', () => {
  const renderer = {
    render: jest.fn(),
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    dispose: jest.fn(),
  };
  return { __renderer: renderer, createRenderer: jest.fn(() => renderer) };
});

const { __context: gl } = jest.requireMock('expo-gl');
const { __renderer: renderer } = jest.requireMock('../renderer');

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const answer: EarthMark = { bearing: 261.4, distanceKm: 6079, color: '#EF4444' };

type PanConfig = Parameters<typeof PanResponder.create>[0];
/** Un doigt, a cet endroit de l'ecran. */
const finger = (x: number, y: number) =>
  ({ nativeEvent: { pageX: x, pageY: y, touches: [{ pageX: x, pageY: y }] } }) as never;
/** Deux doigts, a cet ecartement. */
const pinch = (gap: number) =>
  ({
    nativeEvent: { pageX: 0, pageY: 0, touches: [{ pageX: 0, pageY: 0 }, { pageX: 0, pageY: gap }] },
  }) as never;
/** Nombre de doigts que le geste dit etre sur la vitre ; 0 = move parasite apres le lache. */
const touching = (count: number) => ({ numberActiveTouches: count }) as never;

/** Nombre de "N" a l'ecran : le label du pole et le bouton "retour au nord" en portent un chacun,
 * donc deux = le pole est la. */
const northLabels = (queryAllByText: (text: string) => unknown[]) => queryAllByText('N').length;

/** Rend le globe et remet les handlers tactiles qu'il vient de poser. */
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
    const { getByLabelText, queryAllByText, queryByText } = await renderGlobe();
    expect(getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
    expect(northLabels(queryAllByText)).toBe(2);
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

  it('can be left without answers', async () => {
    const { queryAllByText, queryByText } = await renderGlobe({ marks: [] });
    expect(northLabels(queryAllByText)).toBe(2);
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
    const { config, queryAllByText, queryByText } = await renderGlobe({ marks: [{ ...answer, isTruth: true }] });
    const drawings = renderer.render.mock.calls.length;

    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    // Chaque move est le pas depuis le precedent : le globe suit le doigt sans cumuler deux fois.
    await act(() => config.onPanResponderMove?.(finger(10, -1000), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(20, -2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();
    expect(northLabels(queryAllByText)).toBe(1);
    expect(renderer.render.mock.calls.length).toBeGreaterThan(drawings);

    // Pencher dans l'autre sens ramene le point de depart.
    await act(() => config.onPanResponderMove?.(finger(20, 2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeTruthy();
  });

  it('starts a new turn from where the finger lands, and ignores a move once the finger is gone', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(0, -2000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // Lacher puis retoucher loin de la : le globe ne doit pas sauter de l'ecart entre les deux endroits.
    await act(() => config.onPanResponderRelease?.(finger(0, -2000), touching(0)));
    await act(() => config.onPanResponderGrant?.(finger(0, 500), touching(1)));
    await act(() => config.onPanResponderMove?.(finger(0, 510), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // Le web envoie un dernier move apres le lache : il ramenait le globe au depart.
    await act(() => config.onPanResponderMove?.(finger(0, 4000), touching(0)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();

    // Un geste interrompu (un defilement qui prend la main) ne laisse rien non plus.
    await act(() => config.onPanResponderTerminate?.(finger(0, 510), touching(0)));
    await act(() => config.onPanResponderMove?.(finger(0, 9000), touching(1)));
    expect(queryByText(PLAYER_LABEL)).toBeNull();
  });

  it('keeps the gesture to itself, so the page does not scroll under the finger', async () => {
    const { config } = await renderGlobe();
    expect(config.onShouldBlockNativeResponder?.({} as never, {} as never)).toBe(true);
  });
});

describe('Globe3D — zooming', () => {
  /** Le satellite ne survole que le globe sans zoom : dit si le zoom a bouge. */
  const zoomed = (queryByText: (text: string) => unknown) => queryByText('🛰️') === null;

  it('zooms in and out with two fingers', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(pinch(100), touching(2)));
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    // Des doigts pas encore ecartes ne changent rien.
    expect(zoomed(queryByText)).toBe(false);
    await act(() => config.onPanResponderMove?.(pinch(300), touching(2)));
    expect(zoomed(queryByText)).toBe(true);

    await act(() => config.onPanResponderMove?.(pinch(50), touching(2)));
    expect(zoomed(queryByText)).toBe(false);
  });

  it('only measures the gap on the move a second finger lands, then zooms', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(finger(0, 0), touching(1)));
    // Rien a comparer a ce premier ecart : le zoom ne doit pas sauter des que le 2e doigt touche.
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    expect(zoomed(queryByText)).toBe(false);
    await act(() => config.onPanResponderMove?.(pinch(300), touching(2)));
    expect(zoomed(queryByText)).toBe(true);
  });

  it('does not jump when a pinch goes back to a single finger', async () => {
    const { config, queryByText } = await renderGlobe();
    await act(() => config.onPanResponderGrant?.(pinch(100), touching(2)));
    await act(() => config.onPanResponderMove?.(pinch(100), touching(2)));
    // Seul l'ecartement compte : lever un doigt et continuer tourne depuis le dernier.
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

  it('shrinks the dots back to their screen size as it zooms in', async () => {
    const { getByLabelText } = await renderGlobe();
    // La scene est construite pour de vrai (seule la carte graphique est simulee) : le globe remis est celui qui
    // serait dessine.
    const dotScale = () => {
      const drawn = renderer.render.mock.calls[renderer.render.mock.calls.length - 1][0] as {
        children: { geometry?: { type: string }; scale: { x: number } }[];
      };
      return drawn.children.find((object) => object.geometry?.type === 'SphereGeometry' && object.scale.x !== 1)?.scale
        .x;
    };
    expect(dotScale()).toBeUndefined();

    await fireEvent.press(getByLabelText(ZOOM_IN_HINT));
    expect(dotScale()).toBeCloseTo(1 / ZOOM_STEP, 6);
    await fireEvent.press(getByLabelText(ZOOM_IN_HINT));
    expect(dotScale()).toBeCloseTo(1 / ZOOM_STEP ** 2, 6);

    await fireEvent.press(getByLabelText(RESET_HINT));
    expect(dotScale()).toBeUndefined();
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

  it('flies round the equator: over the ball, then behind it, and back', async () => {
    const { queryByText } = await renderGlobe();
    const seen: boolean[] = [];
    for (let step = 0; step < 16; step += 1) {
      seen.push(queryByText('🛰️') !== null);
      await act(() => jest.advanceTimersByTime(ORBIT_MS / 16));
    }
    expect(seen).toContain(true);
    expect(seen).toContain(false);
  });

  it('shows a joke when the satellite is tapped, and hides it on a second tap', async () => {
    const { getByText, queryByText } = await renderGlobe();
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
    await fireEvent.press(getByText('🛰️'));
    expect(getByText(SATELLITE_QUIP)).toBeTruthy();
    await fireEvent.press(getByText('🛰️'));
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
  });

  it('flies whatever the answers are, even with none', async () => {
    const withAnswers = await renderGlobe({ marks: [answer, { ...answer, bearing: 90, isTruth: true }] });
    expect(withAnswers.queryByText('🛰️')).toBeTruthy();
    const empty = await renderGlobe({ marks: [] });
    expect(empty.queryByText('🛰️')).toBeTruthy();
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

import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder } from 'react-native';

import type { EarthMark } from '@/components/EarthSection';

import { SATELLITE_QUIP } from '@/components/EarthSection/constants';
import { ThemeSettingsContext } from '@/themes';

import { CAPTION_GLOBE, ORBIT_MS, POLE_RADIUS } from './constants';
import Globe3D from '.';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const answer: EarthMark = { bearing: 291.6, distanceKm: 5837, color: '#EF4444' };

type Json = { type?: string; props?: { content?: string | null }; children?: Json[] | null };
type PanConfig = Parameters<typeof PanResponder.create>[0];

/** The svg text node of the origin label (react-native-svg text is not reachable by the text queries). */
const hasLabel = (node: Json): boolean =>
  (node.type === 'RNSVGText' && node.children?.[0]?.props?.content === 'toi') || (node.children ?? []).some(hasLabel);

describe('Globe3D', () => {
  it('renders the globe with the origin labelled', async () => {
    const { getByLabelText, toJSON } = await render(<Globe3D marks={[answer]} origin={PARIS} size={240} />);
    expect(getByLabelText(CAPTION_GLOBE)).toBeTruthy();
    expect(hasLabel(toJSON() as Json)).toBe(true);
  });

  it('renders the true answer as a circled point and a faded answer without crashing', async () => {
    const marks: EarthMark[] = [
      { ...answer, isTruth: true },
      { ...answer, color: '#16A34A', opacity: 0.4 },
    ];
    const { toJSON } = await render(<Globe3D marks={marks} origin={PARIS} size={240} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without answers', async () => {
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    expect(hasLabel(toJSON() as Json)).toBe(true);
  });

  it('turns with the finger until the starting point and the true answer are behind the globe', async () => {
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { toJSON } = await render(<Globe3D marks={[{ ...answer, isTruth: true }]} origin={PARIS} size={240} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanConfig;
    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onPanResponderTerminationRequest?.({} as never, {} as never)).toBe(false);

    await act(() => config.onPanResponderGrant?.({} as never, {} as never));
    // Moves are cumulative within a gesture: the second one only adds what is new since the first.
    await act(() => config.onPanResponderMove?.({} as never, { dx: 10, dy: -1000 } as never));
    await act(() => config.onPanResponderMove?.({} as never, { dx: 20, dy: -2000 } as never));
    expect(hasLabel(toJSON() as Json)).toBe(false);

    // A new gesture starts from zero again: tipping the other way brings the starting point back.
    await act(() => config.onPanResponderGrant?.({} as never, {} as never));
    await act(() => config.onPanResponderMove?.({} as never, { dx: 0, dy: 4000 } as never));
    expect(hasLabel(toJSON() as Json)).toBe(true);
    createSpy.mockRestore();
  });
});

/** How many svg paths are drawn: the land, then the guides and the routes. */
const countPaths = (node: Json): number =>
  (node.type === 'RNSVGPath' ? 1 : 0) + (node.children ?? []).reduce((total, child) => total + countPaths(child), 0);

describe('Globe3D — land and guides', () => {
  const paths = async (props: Partial<React.ComponentProps<typeof Globe3D>>) => {
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} {...props} />);
    return countPaths(toJSON() as Json);
  };

  it('draws the land by default, and none without it', async () => {
    expect(await paths({})).toBe(1);
    expect(await paths({ land: false })).toBe(0);
  });

  it('draws the equator and the Greenwich meridian on request, seen from where the origin is', async () => {
    expect(await paths({ land: false, equator: true })).toBeGreaterThanOrEqual(1);
    expect(await paths({ land: false, greenwich: true })).toBeGreaterThanOrEqual(1);
    expect(await paths({ land: false, equator: true, greenwich: true })).toBeGreaterThan(
      await paths({ land: false, equator: true }),
    );
  });
});

describe('Globe3D — north axis', () => {
  type Node = { type?: string; props?: { r?: number; content?: string | null }; children?: Node[] | null };
  const count = (node: Node, test: (n: Node) => boolean): number =>
    (test(node) ? 1 : 0) + (node.children ?? []).reduce((total, child) => total + count(child, test), 0);
  const isLine = (n: Node) => n.type === 'RNSVGLine';
  const isN = (n: Node) => n.type === 'RNSVGTSpan' && n.props?.content === 'N';
  const isPole = (n: Node) => n.type === 'RNSVGCircle' && n.props?.r === POLE_RADIUS;

  it('draws the axis with an N, and a dot at the north pole when it is in front', async () => {
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    expect(count(toJSON() as Node, isLine)).toBe(1);
    expect(count(toJSON() as Node, isN)).toBe(1);
    expect(count(toJSON() as Node, isPole)).toBe(1);
  });

  it('loses the dot, not the axis, once the globe is tipped so that the north pole is behind', async () => {
    const createSpy = jest.spyOn(PanResponder, 'create');
    const { toJSON } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanConfig;
    await act(() => config.onPanResponderGrant?.({} as never, {} as never));
    await act(() => config.onPanResponderMove?.({} as never, { dx: 0, dy: -4000 } as never));
    expect(count(toJSON() as Node, isLine)).toBe(1);
    expect(count(toJSON() as Node, isPole)).toBe(0);
    createSpy.mockRestore();
  });

  it('can be left out', async () => {
    const { toJSON } = await render(<Globe3D axis={false} marks={[]} origin={PARIS} size={240} />);
    expect(count(toJSON() as Node, isLine)).toBe(0);
    expect(count(toJSON() as Node, isN)).toBe(0);
  });
});

describe('Globe3D — fixed', () => {
  it('has no touch handlers when it cannot be turned', async () => {
    const fixed = await render(<Globe3D draggable={false} marks={[]} origin={PARIS} size={240} />);
    const turnable = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    const handlers = (tree: unknown) => (tree as { props: Record<string, unknown> }).props.onStartShouldSetResponder;
    expect(handlers(fixed.toJSON())).toBeUndefined();
    expect(handlers(turnable.toJSON())).toBeDefined();
  });
});

describe('Globe3D — satellite', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('flies over the starting point, goes behind the globe and comes back', async () => {
    const { queryByText } = await render(<Globe3D marks={[answer]} origin={PARIS} size={240} />);
    expect(queryByText('🛰️')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 2));
    expect(queryByText('🛰️')).toBeNull();
    await act(() => jest.advanceTimersByTime(ORBIT_MS / 2));
    expect(queryByText('🛰️')).toBeTruthy();
  });

  it('shows a joke when the satellite is tapped, and hides it on a second tap', async () => {
    const { getByText, queryByText } = await render(<Globe3D marks={[answer]} origin={PARIS} size={240} />);
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
    await fireEvent.press(getByText('🛰️'));
    expect(getByText(SATELLITE_QUIP)).toBeTruthy();
    await fireEvent.press(getByText('🛰️'));
    expect(queryByText(SATELLITE_QUIP)).toBeNull();
  });

  it('follows the true answer when there is one', async () => {
    const marks: EarthMark[] = [answer, { ...answer, bearing: 90, isTruth: true }];
    const { queryByText } = await render(<Globe3D marks={marks} origin={PARIS} size={240} />);
    expect(queryByText('🛰️')).toBeTruthy();
  });

  it('has no satellite when asked not to have one', async () => {
    const { queryByText } = await render(<Globe3D marks={[answer]} origin={PARIS} satellite={false} size={240} />);
    expect(queryByText('🛰️')).toBeNull();
  });

  it('has no satellite without an answer to follow', async () => {
    const { queryByText } = await render(<Globe3D marks={[]} origin={PARIS} size={240} />);
    expect(queryByText('🛰️')).toBeNull();
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

import { act, render } from '@testing-library/react-native';
import { Keyboard, Text } from 'react-native';

import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import type { RoundBoard } from '@/games/contour/helpers/roundBoard';

import ContourFullBleedScreen from '.';

const FULL = [
  { x: 0, y: 0 },
  { x: 100, y: 50 },
];
const COARSE = [
  { x: 0, y: 0 },
  { x: 60, y: 7 },
  { x: 100, y: 50 },
];

const board: RoundBoard = {
  country: {
    code: 'FR',
    fr: 'France',
    en: 'France',
    points: [],
    neighbors: [],
    centerLabel: { x: 0.5, y: 0.5 },
    difficulty: 'easy',
    capital: null,
    cities: [],
  },
  width: 100,
  height: 50,
  outline: [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ],
  precisionOutlines: [COARSE, FULL, FULL, FULL],
  neighborOutlines: [],
  neighborBorders: [],
  coastlines: [
    [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ],
  ],
  borders: [],
  cityMarks: [],
  capitalMark: null,
  centerPosition: { x: 50, y: 25 },
  neighborHints: [],
};

// Silhouette hints only: 3 precision steps, then the reveal (4 steps).
const plan = buildHintPlan(['silhouette'], board.country);

const baseProps = {
  board,
  plan,
  hintsRevealed: plan.length,
  hintLabels: [{ position: { x: 10, y: 10 }, text: 'France' }],
  roundKey: 0,
  onBoardAreaLayout: jest.fn(),
  onOverlayTopLayout: jest.fn(),
  onOverlayBottomLayout: jest.fn(),
  header: <Text>Header</Text>,
  footer: <Text>Footer</Text>,
};

describe('ContourFullBleedScreen', () => {
  it('lifts the footer above the keyboard', async () => {
    let show: ((event: { endCoordinates: { height: number } }) => void) | undefined;
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, listener: never) => {
      if (name === 'keyboardDidShow') show = listener;
      return { remove: jest.fn() };
    }) as never);
    const { toJSON } = await render(<ContourFullBleedScreen {...baseProps} />);
    const bottomOf = () => {
      let found: unknown;
      const walk = (node: unknown) => {
        if (node === null || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(walk);
        const { props, children } = node as { props?: { onLayout?: unknown; style?: unknown }; children?: unknown };
        if (props?.onLayout === baseProps.onOverlayBottomLayout) found = props.style;
        walk(children);
      };
      walk(toJSON());
      return JSON.stringify(found);
    };
    expect(bottomOf()).toContain('"bottom":0');
    await act(async () => show?.({ endCoordinates: { height: 280 } }));
    expect(bottomOf()).toContain('"bottom":280');
    jest.restoreAllMocks();
  });

  it('draws the board with its hints, under the floating header and footer', async () => {
    const { getByText, toJSON } = await render(<ContourFullBleedScreen {...baseProps} />);
    expect(JSON.stringify(toJSON())).toContain('France');
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });

  it('draws the board overlay over the board, when there is one', async () => {
    const { getByText, queryByText, rerender } = await render(<ContourFullBleedScreen {...baseProps} />);
    expect(queryByText('Overlay')).toBeNull();
    await rerender(<ContourFullBleedScreen {...baseProps} boardOverlay={<Text>Overlay</Text>} />);
    expect(getByText('Overlay')).toBeTruthy();
  });

  it('draws the full ring once the silhouette hints are out', async () => {
    const { toJSON } = await render(<ContourFullBleedScreen {...baseProps} />);
    expect(JSON.stringify(toJSON())).not.toContain('L 60 7');
  });

  it('draws the simplified outline of the requested precision level', async () => {
    const { toJSON } = await render(<ContourFullBleedScreen {...baseProps} hintsRevealed={0} />);
    expect(JSON.stringify(toJSON())).toContain('L 60 7');
  });

  it('renders extra children (an overlay) on top of everything', async () => {
    const { getByText } = await render(
      <ContourFullBleedScreen {...baseProps}>
        <Text>Overlay</Text>
      </ContourFullBleedScreen>,
    );
    expect(getByText('Overlay')).toBeTruthy();
  });

  it('wires the layout callbacks of the board area and of both bands', async () => {
    const { toJSON } = await render(<ContourFullBleedScreen {...baseProps} />);
    const handlers: unknown[] = [];
    const walk = (node: unknown) => {
      if (node === null || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(walk);
      const { props, children } = node as { props?: { onLayout?: unknown }; children?: unknown };
      if (props?.onLayout) handlers.push(props.onLayout);
      walk(children);
    };
    walk(toJSON());
    expect(handlers).toEqual([
      baseProps.onBoardAreaLayout,
      baseProps.onOverlayTopLayout,
      baseProps.onOverlayBottomLayout,
    ]);
  });
});

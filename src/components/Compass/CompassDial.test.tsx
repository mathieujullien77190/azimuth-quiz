import { render } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

import { night } from '@/themes';

import { CompassDial } from './CompassDial';
import { TICK_STEP_DEG } from './constants';
import type { CompassDialProps } from './types';

const baseProps: CompassDialProps = { size: 100, bearing: null, extraNeedles: [], truthBearing: null };

// react-native-svg renders each primitive as a native host component (RNSVGLine, RNSVGPath
// for <Polygon>...) and turns its colors into an ARGB integer: we query by native tag name
// and decode the expected integer rather than comparing a hex string.
const byType = (root: TestInstance | null, type: string) =>
  root?.queryAll((instance) => instance.type === type) ?? [];
// An explicit <G> from the JSX always appears under the implicit RNSVGGroup that Svg inserts for
// everything: we only count groups whose parent is already a group.
const explicitGroups = (root: TestInstance | null) =>
  root?.queryAll((instance) => instance.type === 'RNSVGGroup' && instance.parent?.type === 'RNSVGGroup') ?? [];
const toColorPayload = (hex: string) => (0xff000000 | parseInt(hex.slice(1), 16)) >>> 0;
const fillPayload = (instance: TestInstance) => (instance.props.fill as { payload: number } | null)?.payload;

describe('CompassDial', () => {
  it('draws one tick per TICK_STEP_DEG and the 4 cardinal labels', async () => {
    const { root } = await render(<CompassDial {...baseProps} />);
    expect(byType(root, 'RNSVGLine')).toHaveLength(360 / TICK_STEP_DEG);
    const labels = byType(root, 'RNSVGTSpan').map((tspan) => tspan.props.content);
    expect(labels).toEqual(['N', 'E', 'S', 'O']);
  });

  it('highlights N in the danger color and the other cardinals in textMuted', async () => {
    const { root } = await render(<CompassDial {...baseProps} />);
    const textContent = (text: TestInstance) =>
      (text.children[0] as unknown as TestInstance).props.content as string;
    const texts = byType(root, 'RNSVGText');
    const northText = texts.find((text) => textContent(text) === 'N');
    const eastText = texts.find((text) => textContent(text) === 'E');
    expect(northText && fillPayload(northText)).toBe(toColorPayload(night.colors.danger));
    expect(eastText && fillPayload(eastText)).toBe(toColorPayload(night.colors.textMuted));
  });

  it('renders no player needle when bearing is null', async () => {
    const { root } = await render(<CompassDial {...baseProps} />);
    expect(byType(root, 'RNSVGPath')).toHaveLength(0);
  });

  it('renders the player needle with a custom color', async () => {
    const { root } = await render(<CompassDial {...baseProps} bearing={90} color="#123456" />);
    const paths = byType(root, 'RNSVGPath');
    expect(paths).toHaveLength(1);
    expect(fillPayload(paths[0])).toBe(toColorPayload('#123456'));
  });

  it('falls back to the theme accent color when no color is given', async () => {
    const { root } = await render(<CompassDial {...baseProps} bearing={90} />);
    expect(fillPayload(byType(root, 'RNSVGPath')[0])).toBe(toColorPayload(night.colors.accent));
  });

  it('renders the truth needle in the truth color when provided', async () => {
    const { root } = await render(<CompassDial {...baseProps} truthBearing={180} />);
    const paths = byType(root, 'RNSVGPath');
    expect(paths).toHaveLength(1);
    expect(fillPayload(paths[0])).toBe(toColorPayload(night.colors.truth));
    expect(byType(root, 'RNSVGCircle').some((circle) => fillPayload(circle) === toColorPayload(night.colors.truth))).toBe(
      true,
    );
  });

  it('renders no truth needle when truthBearing is null', async () => {
    const { root } = await render(<CompassDial {...baseProps} />);
    expect(explicitGroups(root)).toHaveLength(0);
  });

  it('renders one <G> group with a colored needle per extra needle', async () => {
    const extraNeedles = [
      { bearing: 10, color: '#111111' },
      { bearing: 200, color: '#222222' },
    ];
    const { root } = await render(<CompassDial {...baseProps} extraNeedles={extraNeedles} />);
    expect(explicitGroups(root)).toHaveLength(2);
    const paths = byType(root, 'RNSVGPath');
    expect(paths.map(fillPayload)).toEqual([toColorPayload('#111111'), toColorPayload('#222222')]);
  });

  it('renders bearing, truth and extra needles all together', async () => {
    const extraNeedles = [{ bearing: 10, color: '#111111' }];
    const { root } = await render(
      <CompassDial {...baseProps} bearing={0} extraNeedles={extraNeedles} truthBearing={45} />,
    );
    expect(byType(root, 'RNSVGPath')).toHaveLength(3);
  });
});

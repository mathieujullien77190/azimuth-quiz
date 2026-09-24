import { render } from '@testing-library/react-native';
import Svg from 'react-native-svg';
import type { TestInstance } from 'test-renderer';

import { night } from '@/themes';

import { CompassFace } from './CompassFace';
import { TICK_STEP_DEG } from './constants';
import * as helpers from './helpers';

const baseProps = { size: 100, colors: night.colors, typography: night.typography, westLabel: 'O' };

// CompassFace only renders bare SVG primitives (no own <Svg> root, see CompassDial): wrap it the
// same way CompassDial does, otherwise react-native-svg can't resolve color props into the
// native ARGB payload format the other assertions below rely on.
const renderFace = (props: typeof baseProps) => render(<Svg><CompassFace {...props} /></Svg>);

const byType = (root: TestInstance | null, type: string) =>
  root?.queryAll((instance) => instance.type === type) ?? [];
const toColorPayload = (hex: string) => (0xff000000 | parseInt(hex.slice(1), 16)) >>> 0;
const fillPayload = (instance: TestInstance) => (instance.props.fill as { payload: number } | null)?.payload;

describe('CompassFace', () => {
  it('draws one tick per TICK_STEP_DEG and the 4 cardinal labels', async () => {
    const { root } = await renderFace(baseProps);
    expect(byType(root, 'RNSVGLine')).toHaveLength(360 / TICK_STEP_DEG);
    const labels = byType(root, 'RNSVGTSpan').map((tspan) => tspan.props.content);
    expect(labels).toEqual(['N', 'E', 'S', 'O']);
  });

  it('highlights N in the danger color and the other cardinals in textMuted', async () => {
    const { root } = await renderFace(baseProps);
    const textContent = (text: TestInstance) =>
      (text.children[0] as unknown as TestInstance).props.content as string;
    const texts = byType(root, 'RNSVGText');
    const northText = texts.find((text) => textContent(text) === 'N');
    const eastText = texts.find((text) => textContent(text) === 'E');
    expect(northText && fillPayload(northText)).toBe(toColorPayload(night.colors.danger));
    expect(eastText && fillPayload(eastText)).toBe(toColorPayload(night.colors.textMuted));
  });

  it('does not recompute ticks/cardinal points on a rerender with the same size/westLabel', async () => {
    const buildTicksSpy = jest.spyOn(helpers, 'buildTicks');
    const cardinalPointsSpy = jest.spyOn(helpers, 'cardinalPoints');
    const { rerender } = await renderFace(baseProps);
    expect(buildTicksSpy).toHaveBeenCalledTimes(1);
    expect(cardinalPointsSpy).toHaveBeenCalledTimes(1);

    // Same size/westLabel, only colors reference changes: the memoized geometry is untouched.
    await rerender(
      <Svg>
        <CompassFace {...baseProps} colors={{ ...night.colors }} />
      </Svg>,
    );
    expect(buildTicksSpy).toHaveBeenCalledTimes(1);
    expect(cardinalPointsSpy).toHaveBeenCalledTimes(1);

    buildTicksSpy.mockRestore();
    cardinalPointsSpy.mockRestore();
  });
});

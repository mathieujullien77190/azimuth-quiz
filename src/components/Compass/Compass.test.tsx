import { render } from '@testing-library/react-native';
import { PanResponder, Platform } from 'react-native';

import Compass from '.';
import { useHeading } from './useHeading';

jest.mock('./useHeading');

const mockedUseHeading = useHeading as jest.Mock;
const onTouch = jest.fn();

type PanResponderConfig = Parameters<typeof PanResponder.create>[0];

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseHeading.mockReturnValue({ heading: null, onTouch });
});

describe('Compass — decorative (no onChange)', () => {
  it('is accessible as an image and exposes no gesture handlers', async () => {
    const { getByLabelText } = await render(<Compass bearing={90} size={200} />);
    const view = getByLabelText('Boussole');
    expect(view.props.accessibilityRole).toBe('image');
    expect(view.props.onStartShouldSetResponder).toBeUndefined();
  });

  it('leaves the gesture handlers disabled even if PanResponder is asked', async () => {
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass bearing={90} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(false);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(false);
    expect(config.onMoveShouldSetPanResponderCapture?.({} as never, {} as never)).toBe(false);
  });
});

describe('Compass — interactive (onChange provided)', () => {
  it('is accessible as adjustable', async () => {
    const { getByLabelText } = await render(<Compass bearing={null} onChange={jest.fn()} size={200} />);
    expect(getByLabelText('Boussole').props.accessibilityRole).toBe('adjustable');
  });

  it('reports the bearing under the touch, and arms the sensor on first contact', async () => {
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass bearing={null} onChange={onChange} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;

    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponderCapture?.({} as never, {} as never)).toBe(true);
    expect(config.onPanResponderTerminationRequest?.({} as never, {} as never)).toBe(false);
    expect(config.onShouldBlockNativeResponder?.({} as never, {} as never)).toBe(true);

    // Touche en haut du cadran : cap 0 (le heading du capteur, null ici, vaut 0).
    config.onPanResponderGrant?.({ nativeEvent: { locationX: 100, locationY: 0 } } as never, {} as never);
    expect(onTouch).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(0);

    // Glisse vers la droite, mi-hauteur : cap 90.
    config.onPanResponderMove?.({ nativeEvent: { locationX: 200, locationY: 100 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('adds the sensor heading to the touch bearing', async () => {
    mockedUseHeading.mockReturnValue({ heading: 45, onTouch });
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass bearing={null} live onChange={onChange} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;

    config.onPanResponderGrant?.({ nativeEvent: { locationX: 100, locationY: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(45);
  });
});

describe('Compass — north marker (live heading)', () => {
  it('shows the north marker only once the heading is known', async () => {
    mockedUseHeading.mockReturnValue({ heading: null, onTouch });
    const { root, rerender } = await render(<Compass bearing={0} size={100} />);
    const svgCount = () => (root?.queryAll((instance) => instance.type === 'RNSVGSvgView').length ?? 0);
    expect(svgCount()).toBe(1);

    mockedUseHeading.mockReturnValue({ heading: 45, onTouch });
    await rerender(<Compass bearing={0} live size={100} />);
    expect(svgCount()).toBe(2);
  });
});

describe('Compass — web touch handling', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('disables native scroll capture on web while interactive', async () => {
    Platform.OS = 'web';
    const { getByLabelText } = await render(<Compass bearing={null} onChange={jest.fn()} size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style).toContainEqual({ touchAction: 'none' });
  });

  it('does not touch scroll behavior when decorative, even on web', async () => {
    Platform.OS = 'web';
    const { getByLabelText } = await render(<Compass bearing={null} size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style.some((entry) => typeof entry === 'object' && entry !== null && 'touchAction' in entry)).toBe(false);
  });

  it('does not touch scroll behavior on native, even while interactive', async () => {
    Platform.OS = 'ios';
    const { getByLabelText } = await render(<Compass bearing={null} onChange={jest.fn()} size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style.some((entry) => typeof entry === 'object' && entry !== null && 'touchAction' in entry)).toBe(false);
  });
});

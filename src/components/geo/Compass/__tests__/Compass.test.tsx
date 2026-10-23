import { render } from '@testing-library/react-native';
import { PanResponder, Platform } from 'react-native';

import Compass from '..';

type PanResponderConfig = Parameters<typeof PanResponder.create>[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Compass — decorative (no onChange)', () => {
  it('is accessible as an image and exposes no gesture handlers', async () => {
    const { getByLabelText } = await render(<Compass needles={[{ bearing: 90, color: '#123456' }]} size={200} />);
    const view = getByLabelText('Boussole');
    expect(view.props.accessibilityRole).toBe('image');
    expect(view.props.onStartShouldSetResponder).toBeUndefined();
  });

  it('leaves the gesture handlers disabled even if PanResponder is asked', async () => {
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass needles={[{ bearing: 90, color: '#123456' }]} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;
    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(false);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(false);
    expect(config.onMoveShouldSetPanResponderCapture?.({} as never, {} as never)).toBe(false);
  });
});

describe('Compass — interactive (onChange provided)', () => {
  it('is accessible as adjustable', async () => {
    const { getByLabelText } = await render(<Compass onChange={jest.fn()} size={200} />);
    expect(getByLabelText('Boussole').props.accessibilityRole).toBe('adjustable');
  });

  it('reports the bearing under the touch', async () => {
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass onChange={onChange} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;

    expect(config.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    expect(config.onMoveShouldSetPanResponderCapture?.({} as never, {} as never)).toBe(true);
    expect(config.onPanResponderTerminationRequest?.({} as never, {} as never)).toBe(false);
    expect(config.onShouldBlockNativeResponder?.({} as never, {} as never)).toBe(true);

    // Toucher en haut du cadran : cap 0.
    config.onPanResponderGrant?.({ nativeEvent: { locationX: 100, locationY: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(0);

    // Glisser a droite, mi-hauteur : cap 90.
    config.onPanResponderMove?.({ nativeEvent: { locationX: 200, locationY: 100 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('does not call onChange again when the touch resolves to the same bearing', async () => {
    const onChange = jest.fn();
    const createSpy = jest.spyOn(PanResponder, 'create');
    await render(<Compass onChange={onChange} size={200} />);
    const config = createSpy.mock.calls[createSpy.mock.calls.length - 1][0] as PanResponderConfig;

    config.onPanResponderGrant?.({ nativeEvent: { locationX: 100, locationY: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledTimes(1);

    // Meme position : meme cap calcule (0), dedupliquee.
    config.onPanResponderMove?.({ nativeEvent: { locationX: 100, locationY: 0 } } as never, {} as never);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('Compass — web touch handling', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('disables native scroll capture on web while interactive', async () => {
    Platform.OS = 'web';
    const { getByLabelText } = await render(<Compass onChange={jest.fn()} size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style).toContainEqual({ touchAction: 'none' });
  });

  it('does not touch scroll behavior when decorative, even on web', async () => {
    Platform.OS = 'web';
    const { getByLabelText } = await render(<Compass size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style.some((entry) => typeof entry === 'object' && entry !== null && 'touchAction' in entry)).toBe(false);
  });

  it('does not touch scroll behavior on native, even while interactive', async () => {
    Platform.OS = 'ios';
    const { getByLabelText } = await render(<Compass onChange={jest.fn()} size={100} />);
    const style = getByLabelText('Boussole').props.style as unknown[];
    expect(style.some((entry) => typeof entry === 'object' && entry !== null && 'touchAction' in entry)).toBe(false);
  });
});

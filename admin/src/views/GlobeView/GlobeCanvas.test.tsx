import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  setCountries: vi.fn(),
  setPlaces: vi.fn(),
  setLayers: vi.fn(),
  setLabels: vi.fn(),
  setCountryNames: vi.fn(),
  setMarks: vi.fn(),
  pick: vi.fn(),
  flyTo: vi.fn(),
  resetView: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('./GlobeScene', () => ({ createGlobeScene: vi.fn(() => fake) }));

import { GlobeCanvas, type GlobeCanvasProps } from './GlobeCanvas';
import { createGlobeScene } from './GlobeScene';
import { shapeOf } from './helpers';
import type { PlaceBuffers } from './types';

const buffers: PlaceBuffers = {
  positions: [0, 0, 1],
  kinds: ['round'],
  shapes: {
    round: { positions: [0, 0, 1], colors: [1, 1, 1] },
    star: { positions: [], colors: [] },
    square: { positions: [], colors: [] },
  },
};
const emptyBuffers: PlaceBuffers = {
  positions: [],
  kinds: [],
  shapes: {
    round: { positions: [], colors: [] },
    star: { positions: [], colors: [] },
    square: { positions: [], colors: [] },
  },
};

const props = (over: Partial<GlobeCanvasProps> = {}): GlobeCanvasProps => ({
  countryGroups: [{ color: 1, positions: [0, 0, 1, 0, 1, 0] }],
  placeBuffers: buffers,
  placeKeys: ['par', 'tok'],
  placeNames: ['Paris', 'Tokyo'],
  countryNames: [
    { name: 'France', lon: 2, lat: 46 },
    { name: 'Japon', lon: 138, lat: 36 },
  ],
  shapes: [
    shapeOf(
      'FR',
      [
        [0, 40],
        [10, 40],
        [10, 50],
        [0, 50],
      ],
      'easy',
    ),
  ],
  layers: { countries: true, places: true },
  selectedMark: null,
  hoveredMark: null,
  fly: null,
  resetToken: 0,
  onHover: vi.fn(),
  onSelect: vi.fn(),
  ...over,
});

const canvasOf = (container: HTMLElement) => container.querySelector('canvas')!;

// jsdom's pointer events carry no coordinates: a mouse event of the same type does.
const pointer = (target: Element, type: string, clientX = 0, clientY = 0) =>
  fireEvent(target, new MouseEvent(type, { bubbles: true, clientX, clientY }));

beforeEach(() => {
  for (const method of Object.values(fake)) method.mockReset();
  vi.mocked(createGlobeScene).mockClear();
  fake.pick.mockReturnValue({ place: null, lon: null, lat: null, x: 5, y: 6 });
});

describe('GlobeCanvas scene', () => {
  it('creates the scene once on its canvas, sizes it and gives it what to draw', () => {
    const { container } = render(<GlobeCanvas {...props()} />);
    expect(createGlobeScene).toHaveBeenCalledTimes(1);
    expect(createGlobeScene).toHaveBeenCalledWith(canvasOf(container));
    expect(fake.resize).toHaveBeenCalledTimes(1);
    expect(fake.setCountries).toHaveBeenCalledWith([{ color: 1, positions: [0, 0, 1, 0, 1, 0] }]);
    expect(fake.setPlaces).toHaveBeenCalledWith(buffers);
    expect(fake.setLayers).toHaveBeenCalledWith({ countries: true, places: true });
    expect(fake.setMarks).toHaveBeenCalledWith(null, null);
    expect(fake.flyTo).not.toHaveBeenCalled();
    expect(fake.resetView).not.toHaveBeenCalled();
  });

  it('follows what changes, without recreating the scene', () => {
    const { rerender } = render(<GlobeCanvas {...props()} />);
    const marks = { segments: [], point: [0, 0, 1] as const };
    rerender(
      <GlobeCanvas
        {...props({
          countryGroups: [],
          placeBuffers: emptyBuffers,
          layers: { countries: false, places: true },
          selectedMark: marks,
          hoveredMark: marks,
        })}
      />,
    );
    expect(createGlobeScene).toHaveBeenCalledTimes(1);
    expect(fake.setCountries).toHaveBeenLastCalledWith([]);
    expect(fake.setPlaces).toHaveBeenLastCalledWith(emptyBuffers);
    expect(fake.setLayers).toHaveBeenLastCalledWith({ countries: false, places: true });
    expect(fake.setMarks).toHaveBeenLastCalledWith(marks, marks);
  });

  it('writes the names the scene asks for next to their dots, and nothing once it says there are none', () => {
    const { container } = render(<GlobeCanvas {...props()} />);
    expect(fake.setLabels).toHaveBeenCalledWith(['Paris', 'Tokyo'], expect.any(Function));
    const listener = fake.setLabels.mock.calls[0][1] as (labels: { index: number; x: number; y: number }[]) => void;
    act(() => listener([{ index: 1, x: 40, y: 25 }]));
    const name = container.querySelector('.globe-name') as HTMLElement;
    expect(name.textContent).toBe('Tokyo');
    expect(name.style.left).toBe('40px');
    expect(name.style.top).toBe('25px');
    act(() => listener([]));
    expect(container.querySelector('.globe-name')).toBeNull();
  });

  it('writes the country names the scene asks for, bigger, at the spot it gives', () => {
    const { container } = render(<GlobeCanvas {...props()} />);
    expect(fake.setCountryNames).toHaveBeenCalledWith(props().countryNames, expect.any(Function));
    const listener = fake.setCountryNames.mock.calls[0][1] as (labels: { index: number; x: number; y: number }[]) => void;
    act(() => listener([{ index: 0, x: 70, y: 35 }]));
    const name = container.querySelector('.globe-country-name') as HTMLElement;
    expect(name.textContent).toBe('France');
    expect(name.style.left).toBe('70px');
    act(() => listener([]));
    expect(container.querySelector('.globe-country-name')).toBeNull();
  });

  it('flies on a request, and again on a new request for the same spot', () => {
    const { rerender } = render(<GlobeCanvas {...props()} />);
    rerender(<GlobeCanvas {...props({ fly: { lon: 2, lat: 48, token: 1 } })} />);
    rerender(<GlobeCanvas {...props({ fly: { lon: 2, lat: 48, token: 2 } })} />);
    expect(fake.flyTo).toHaveBeenCalledTimes(2);
    expect(fake.flyTo).toHaveBeenCalledWith(2, 48);
  });

  it('goes back to the home view when the reset is bumped', () => {
    const { rerender } = render(<GlobeCanvas {...props()} />);
    rerender(<GlobeCanvas {...props({ resetToken: 1 })} />);
    expect(fake.resetView).toHaveBeenCalledTimes(1);
  });

  it('follows the window size, and lets everything go when it leaves', () => {
    const { unmount } = render(<GlobeCanvas {...props()} />);
    window.dispatchEvent(new Event('resize'));
    expect(fake.resize).toHaveBeenCalledTimes(2);
    unmount();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('resize'));
    expect(fake.resize).toHaveBeenCalledTimes(2);
  });
});

describe('GlobeCanvas pointer', () => {
  it('hovers a place first, even over a country', () => {
    fake.pick.mockReturnValue({ place: 1, lon: 5, lat: 45, x: 30, y: 40 });
    const onHover = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onHover })} />);
    pointer(canvasOf(container), 'pointermove', 30, 40);
    expect(fake.pick).toHaveBeenCalledWith(30, 40);
    expect(onHover).toHaveBeenCalledWith({ kind: 'place', id: 'tok', x: 30, y: 40 });
  });

  it('hovers the country around the point of the globe when no place is close', () => {
    fake.pick.mockReturnValue({ place: null, lon: 5, lat: 45, x: 30, y: 40 });
    const onHover = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onHover })} />);
    pointer(canvasOf(container), 'pointermove');
    expect(onHover).toHaveBeenCalledWith({ kind: 'country', id: 'FR', x: 30, y: 40 });
  });

  it('hovers nothing over the sea, over empty space, and when the pointer leaves', () => {
    const onHover = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onHover })} />);
    fake.pick.mockReturnValue({ place: null, lon: -40, lat: 0, x: 1, y: 1 });
    pointer(canvasOf(container), 'pointermove');
    fake.pick.mockReturnValue({ place: null, lon: null, lat: null, x: 1, y: 1 });
    pointer(canvasOf(container), 'pointermove');
    pointer(canvasOf(container), 'pointerout');
    expect(onHover).toHaveBeenCalledTimes(3);
    expect(onHover.mock.calls.every(([hit]) => hit === null)).toBe(true);
  });

  it('selects what is under a press that did not move', () => {
    fake.pick.mockReturnValue({ place: 0, lon: null, lat: null, x: 30, y: 40 });
    const onSelect = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onSelect })} />);
    pointer(canvasOf(container), 'pointerdown', 30, 40);
    pointer(canvasOf(container), 'pointerup', 32, 41);
    expect(onSelect).toHaveBeenCalledWith({ kind: 'place', id: 'par' });
  });

  it('selects nothing (closing the panel) when the click is on empty space', () => {
    const onSelect = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onSelect })} />);
    pointer(canvasOf(container), 'pointerdown', 30, 40);
    pointer(canvasOf(container), 'pointerup', 30, 40);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('is not a click when the pointer was dragged (the globe was being turned), or never pressed here', () => {
    const onSelect = vi.fn();
    const { container } = render(<GlobeCanvas {...props({ onSelect })} />);
    pointer(canvasOf(container), 'pointerup', 30, 40);
    pointer(canvasOf(container), 'pointerdown', 30, 40);
    pointer(canvasOf(container), 'pointerup', 80, 90);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

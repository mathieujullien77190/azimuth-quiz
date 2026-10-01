import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContourCountry, ContourNeighbor } from '@/types';

const mocks = vi.hoisted(() => ({
  allContours: vi.fn(),
  deleteNeighbor: vi.fn(),
  saveCenterLabelPosition: vi.fn(),
  saveNeighborPosition: vi.fn(),
  docs: {} as Record<string, unknown>,
}));

vi.mock('../../api/contour', () => ({
  allContours: mocks.allContours,
  deleteNeighbor: mocks.deleteNeighbor,
  saveCenterLabelPosition: mocks.saveCenterLabelPosition,
  saveNeighborPosition: mocks.saveNeighborPosition,
}));
vi.mock('../../data', () => ({
  countryName: (code: string) => `name-${code}`,
  data: () => ({ countries: mocks.docs }),
}));

import { ContourEditor } from './ContourEditor';

type Ring = [number, number][];

/** A closed square outline with a vertex per degree, so that two squares side by side share exact edges. */
const square = (x0: number, y0: number, size: number): Ring => {
  const ring: Ring = [];
  for (let i = 0; i < size; i++) ring.push([x0 + i, y0]);
  for (let i = 0; i < size; i++) ring.push([x0 + size, y0 + i]);
  for (let i = size; i > 0; i--) ring.push([x0 + i, y0 + size]);
  for (let i = size; i > 0; i--) ring.push([x0, y0 + i]);
  ring.push([x0, y0]);
  return ring;
};

const neighbor = (code: string, x: number, y: number): ContourNeighbor => ({ type: 'country', code, x, y });

const makeCountry = (over: Partial<ContourCountry> = {}): ContourCountry => ({
  code: 'AA',
  points: square(0, 0, 10),
  neighbors: [neighbor('BB', 0.5, 0.5), neighbor('CC', 0.25, 0.75)],
  centerLabel: { x: 0.4, y: 0.6 },
  difficulty: 'intermediate',
  ...over,
});

const eastNeighbor: ContourCountry = makeCountry({ code: 'BB', points: square(10, 0, 10), neighbors: [] });

const neighborBoxes = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.contour-neighbor:not(.contour-center-label)'),
];
const centerBox = (container: HTMLElement) => container.querySelector<HTMLElement>('.contour-center-label')!;
const level = (n: number) => screen.getByRole('button', { name: new RegExp(`^Niveau ${n} `) });

beforeEach(() => {
  mocks.allContours.mockReset().mockReturnValue([eastNeighbor]);
  mocks.deleteNeighbor.mockReset().mockResolvedValue(undefined);
  mocks.saveCenterLabelPosition.mockReset().mockResolvedValue(undefined);
  mocks.saveNeighborPosition.mockReset();
  mocks.docs = {};
});

describe('ContourEditor precision levels', () => {
  it('opens on the neighbors level with the shared border, the coast and the neighbors dashed lines', () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(level(4)).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.contour-silhouette')).toBeInTheDocument();
    expect(container.querySelector('.contour-outline')).toBeInTheDocument();
    expect(container.querySelector('.contour-border')).toBeInTheDocument();
    expect(container.querySelector('.contour-neighbor-line')).toBeInTheDocument();
    expect(container.querySelector('.contour-neighbor-shape')).toBeNull();
  });

  it('shows only a coarse outline with its vertices below the full ring', async () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    await userEvent.click(level(0));
    expect(level(0)).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('.contour-vertex').length).toBeGreaterThan(0);
    expect(container.querySelector('.contour-border')).toBeNull();
    expect(container.querySelector('.contour-neighbor-shape')).toBeNull();
  });

  it('draws a plain outline on the full ring without the neighbors option', async () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    await userEvent.click(level(3));
    expect(container.querySelector('.contour-outline')).toBeInTheDocument();
    expect(container.querySelector('.contour-silhouette')).toBeNull();
    expect(container.querySelector('.contour-border')).toBeNull();
  });

  it('fills the neighbors behind the full ring when asked to', async () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} showNeighbors />);
    await userEvent.click(level(3));
    expect(container.querySelectorAll('.contour-neighbor-shape')).toHaveLength(1);
    expect(container.querySelector('.contour-neighbor-line')).toBeNull();
  });

  it('skips the coast, border and neighbor lines that are empty', () => {
    const twin = makeCountry({ code: 'BB', neighbors: [] });
    mocks.allContours.mockReturnValue([twin]);
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(container.querySelector('.contour-outline')).toBeNull();
    expect(container.querySelector('.contour-neighbor-line')).toBeNull();
    expect(container.querySelector('.contour-border')).toBeInTheDocument();
  });

  it('skips the border when no country touches this one', () => {
    mocks.allContours.mockReturnValue([]);
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(container.querySelector('.contour-border')).toBeNull();
    expect(container.querySelector('.contour-outline')).toBeInTheDocument();
  });

  it('draws another variant with a new seed', async () => {
    render(<ContourEditor initialCountry={makeCountry()} />);
    const before = screen.getByText(/^graine /).textContent;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.123);
    await userEvent.click(screen.getByRole('button', { name: 'Autre variante' }));
    random.mockRestore();
    expect(screen.getByText(/^graine /).textContent).not.toBe(before);
  });

  it('returns to the neighbors level from the last button', async () => {
    render(<ContourEditor initialCountry={makeCountry()} />);
    await userEvent.click(level(1));
    await userEvent.click(level(4));
    expect(level(4)).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ContourEditor places', () => {
  it('marks the cities and the capital of the country document', () => {
    mocks.docs = {
      AA: {
        capital: { name: 'Capitale', lon: 5, lat: 5 },
        cities: [{ name: 'Ville', lon: 2, lat: 3 }],
      },
    };
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(screen.getByText('Capitale')).toBeInTheDocument();
    expect(screen.getByText('Ville')).toBeInTheDocument();
    expect(container.querySelector('.contour-place-star')).toBeInTheDocument();
    expect(container.querySelector('.contour-place-dot')).toBeInTheDocument();
  });

  it('marks a country that has a document without cities nor capital', () => {
    mocks.docs = { AA: {} };
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(container.querySelector('.contour-place-name')).toBeNull();
  });

  it('marks nothing for a country without a document', () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(container.querySelector('.contour-place-name')).toBeNull();
  });
});

describe('ContourEditor neighbors', () => {
  it('shows each neighbor and the flag of the country itself', () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    expect(neighborBoxes(container)).toHaveLength(2);
    expect(screen.getAllByText('name-BB').length).toBeGreaterThan(0);
    expect(centerBox(container)).toHaveTextContent('name-AA');
  });

  it('moves a neighbor with the mouse and saves its new fraction of the board', async () => {
    const country = makeCountry();
    const moved = { ...country.neighbors[0], x: 0.9, y: 0.9 };
    mocks.saveNeighborPosition.mockResolvedValue(moved);
    const { container } = render(<ContourEditor initialCountry={country} />);
    const box = neighborBoxes(container)[0];
    const left = parseFloat(box.style.left);
    const top = parseFloat(box.style.top);

    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 130, clientY: 120 });
    expect(box).toHaveClass('dragging');
    expect(parseFloat(box.style.left)).toBeCloseTo(left + 30);
    expect(parseFloat(box.style.top)).toBeCloseTo(top + 20);
    expect(parseFloat(neighborBoxes(container)[1].style.left)).toBeGreaterThan(0);

    fireEvent.mouseUp(window, { clientX: 130, clientY: 120 });
    expect(box).not.toHaveClass('dragging');
    expect(mocks.saveNeighborPosition).toHaveBeenCalledTimes(1);
    const [savedCountry, previous, next] = mocks.saveNeighborPosition.mock.calls[0];
    expect(savedCountry).toBe(country);
    expect(previous).toBe(country.neighbors[0]);
    const width = Number(container.querySelector('svg')!.getAttribute('width'));
    expect(next.x).toBeCloseTo((left + 30) / width);
    await vi.waitFor(() => expect(parseFloat(neighborBoxes(container)[0].style.left)).toBeCloseTo(0.9 * width));
  });

  it('puts the neighbor back when saving its position fails', async () => {
    const country = makeCountry();
    mocks.saveNeighborPosition.mockRejectedValue(new Error('denied'));
    const { container } = render(<ContourEditor initialCountry={country} />);
    const left = neighborBoxes(container)[0].style.left;

    fireEvent.mouseDown(neighborBoxes(container)[0], { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(window, { clientX: 50, clientY: 0 });
    await vi.waitFor(() => expect(neighborBoxes(container)[0].style.left).toBe(left));
  });

  it('ignores a mouse up or move that belongs to a drag already finished', () => {
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    mocks.saveNeighborPosition.mockResolvedValue(makeCountry().neighbors[0]);

    // Two drags started without a mouse up in between: the first mouse up ends both, and a move that lands in
    // the middle of it finds no drag left to follow.
    const probe = () => fireEvent.mouseMove(window, { clientX: 9, clientY: 9 });
    for (const box of [neighborBoxes(container)[0], centerBox(container)]) {
      fireEvent.mouseDown(box, { clientX: 0, clientY: 0 });
      window.addEventListener('mouseup', probe);
      fireEvent.mouseDown(box, { clientX: 0, clientY: 0 });
      fireEvent.mouseUp(window, { clientX: 5, clientY: 5 });
      window.removeEventListener('mouseup', probe);
    }
    expect(mocks.saveNeighborPosition).toHaveBeenCalledTimes(1);
    expect(mocks.saveCenterLabelPosition).toHaveBeenCalledTimes(1);
  });

  it('deletes a neighbor without starting a drag', async () => {
    const country = makeCountry();
    const { container } = render(<ContourEditor initialCountry={country} />);
    const box = neighborBoxes(container)[0];
    await userEvent.click(box.querySelector('.delete-x')!);
    expect(mocks.deleteNeighbor).toHaveBeenCalledWith(country, country.neighbors[0]);
    await vi.waitFor(() => expect(neighborBoxes(container)).toHaveLength(1));
    expect(mocks.saveNeighborPosition).not.toHaveBeenCalled();
  });
});

describe('ContourEditor country flag', () => {
  it('moves the flag of the country and saves the new position', () => {
    const country = makeCountry();
    const { container } = render(<ContourEditor initialCountry={country} />);
    const box = centerBox(container);
    const left = parseFloat(box.style.left);

    fireEvent.mouseDown(box, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(window, { clientX: 40, clientY: 30 });
    expect(box).toHaveClass('dragging');
    expect(parseFloat(box.style.left)).toBeCloseTo(left + 30);
    fireEvent.mouseUp(window, { clientX: 40, clientY: 30 });

    expect(box).not.toHaveClass('dragging');
    const [savedCountry, previous, next] = mocks.saveCenterLabelPosition.mock.calls[0];
    expect(savedCountry).toBe(country);
    expect(previous).toEqual({ x: 0.4, y: 0.6 });
    const width = Number(container.querySelector('svg')!.getAttribute('width'));
    expect(next.x).toBeCloseTo((left + 30) / width);
    expect(parseFloat(centerBox(container).style.left)).toBeCloseTo(left + 30);
  });

  it('puts the flag back when saving fails', async () => {
    mocks.saveCenterLabelPosition.mockRejectedValue(new Error('denied'));
    const { container } = render(<ContourEditor initialCountry={makeCountry()} />);
    const left = centerBox(container).style.left;

    fireEvent.mouseDown(centerBox(container), { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(window, { clientX: 50, clientY: 0 });
    await vi.waitFor(() => expect(centerBox(container).style.left).toBe(left));
  });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContourQuadrantGrid } from './ContourQuadrantGrid';

const renderGrid = (start: number) =>
  render(
    <svg>
      <ContourQuadrantGrid height={100} start={start} width={200} />
    </svg>,
  );

describe('ContourQuadrantGrid', () => {
  it('draws the frame and the two lines through the middle, over everything, without catching the pointer', () => {
    const { container } = renderGrid(0);
    expect(container.querySelector('g.contour-grid')?.getAttribute('pointer-events')).toBe('none');
    const frame = container.querySelector('rect.contour-grid-line');
    expect(frame?.getAttribute('width')).toBe('200');
    expect(frame?.getAttribute('height')).toBe('100');
    const lines = [...container.querySelectorAll('line.contour-grid-line')].map((line) =>
      ['x1', 'y1', 'x2', 'y2'].map((name) => line.getAttribute(name)),
    );
    expect(lines).toEqual([
      ['100', '0', '100', '100'],
      ['0', '50', '200', '50'],
    ]);
  });

  it('numbers the four cells 0 to 3', () => {
    const { container } = renderGrid(0);
    expect([...container.querySelectorAll('.contour-grid-number')].map((text) => text.textContent)).toEqual([
      '0',
      '1',
      '2',
      '3',
    ]);
  });

  it('tints the cell the game would open first, and says so', () => {
    const { container, getByText } = renderGrid(3);
    const tint = container.querySelector('rect.contour-grid-start');
    expect(['x', 'y', 'width', 'height'].map((name) => tint?.getAttribute(name))).toEqual(['100', '50', '100', '50']);
    expect(getByText('case de départ')).toBeTruthy();
  });
});

import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import ContourQuadrantMask from '.';

const props = {
  width: 200,
  height: 100,
  hidden: [1, 2, 3],
  canReveal: true,
  costLabel: '−125 pts',
  labelFor: (index: number) => `Dévoiler le carré ${index + 1}`,
  onReveal: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ContourQuadrantMask', () => {
  it('covers only the hidden cells, each with the lock and what opening it costs', async () => {
    const { getAllByText, getByRole, queryByRole } = await render(<ContourQuadrantMask {...props} />);
    expect(getAllByText('🔒')).toHaveLength(3);
    expect(getAllByText('−125 pts')).toHaveLength(3);
    expect(queryByRole('button', { name: 'Dévoiler le carré 1' })).toBeNull();
    expect(getByRole('button', { name: 'Dévoiler le carré 4' })).toBeTruthy();
  });

  it('puts each cell in its own quarter of the board', async () => {
    const { getByRole } = await render(<ContourQuadrantMask {...props} />);
    const style = (index: number) => StyleSheet.flatten(getByRole('button', { name: `Dévoiler le carré ${index + 1}` }).props.style);
    expect(style(1)).toEqual(expect.objectContaining({ left: 100, top: 0, width: 100, height: 50 }));
    expect(style(2)).toEqual(expect.objectContaining({ left: 0, top: 50, width: 100, height: 50 }));
  });

  it('reports the cell that was tapped', async () => {
    const { getByRole } = await render(<ContourQuadrantMask {...props} />);
    await fireEvent.press(getByRole('button', { name: 'Dévoiler le carré 3' }));
    expect(props.onReveal).toHaveBeenCalledWith(2);
  });

  it('is only locks, without buttons or cost, for a player who cannot open a cell', async () => {
    const { getAllByText, queryByRole, queryByText } = await render(
      <ContourQuadrantMask {...props} canReveal={false} />,
    );
    expect(getAllByText('🔒')).toHaveLength(3);
    expect(queryByText('−125 pts')).toBeNull();
    expect(queryByRole('button')).toBeNull();
  });

  it('shows nothing once every cell is open', async () => {
    const { queryByText } = await render(<ContourQuadrantMask {...props} hidden={[]} />);
    expect(queryByText('🔒')).toBeNull();
  });
});

describe('ContourQuadrantMask — flags behind a hidden cell', () => {
  it('marks a flag lying in a hidden cell with an accent rectangle of the same box, above the cell', async () => {
    const flag = { x: 130, y: 10, width: 28, height: 20 };
    const { toJSON } = await render(<ContourQuadrantMask {...props} flagBoxes={[flag]} />);
    const marker = JSON.stringify(toJSON());
    expect(marker).toContain('"left":130');
    expect(marker).toContain('"width":28');
    expect(marker).toContain('"opacity":0.5');
  });

  it('leaves a flag in an open cell alone, and draws nothing without flags', async () => {
    const open = { x: 20, y: 10, width: 28, height: 20 };
    const withOpenFlag = await render(<ContourQuadrantMask {...props} flagBoxes={[open]} />);
    expect(JSON.stringify(withOpenFlag.toJSON())).not.toContain('"opacity":0.5');
    const without = await render(<ContourQuadrantMask {...props} />);
    expect(JSON.stringify(without.toJSON())).not.toContain('"opacity":0.5');
  });
});

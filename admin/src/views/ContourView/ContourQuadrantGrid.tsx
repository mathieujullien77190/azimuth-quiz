// The geometry comes from the game's own helper (pure, no React Native): the preview and the masks the game draws can
// never disagree about where the cells are.
import { quadrantGridLines, quadrantRects } from '@/games/contour/helpers/quadrants';

/** The corner the number of each cell sits in: a few pixels in from its top-left. */
const LABEL_OFFSET = 4;

/**
 * The 2 x 2 division the game hides the country behind (Silhouette's quadrants), drawn for the editor's preview as lines
 * only — everything stays visible behind: the board's frame and the two cutting lines, thin and see-through, the number of
 * each cell (0 to 3) in its corner, and the cell the game would open first lightly tinted and labelled. An SVG `<g>` to
 * put inside the preview's own `<svg>`; it never catches the pointer.
 */
export const ContourQuadrantGrid = ({ width, height, start }: { width: number; height: number; start: number }) => {
  const { vertical, horizontal } = quadrantGridLines(width, height);
  const cells = quadrantRects(width, height);
  const first = cells[start];

  return (
    <g className="contour-grid" pointerEvents="none">
      <rect className="contour-grid-start" height={first.height} width={first.width} x={first.x} y={first.y} />
      <rect className="contour-grid-line" height={height} width={width} x={0} y={0} />
      <line className="contour-grid-line" x1={vertical[0]} x2={vertical[2]} y1={vertical[1]} y2={vertical[3]} />
      <line className="contour-grid-line" x1={horizontal[0]} x2={horizontal[2]} y1={horizontal[1]} y2={horizontal[3]} />
      {cells.map((cell) => (
        <text className="contour-grid-number" key={cell.index} x={cell.x + LABEL_OFFSET} y={cell.y + LABEL_OFFSET}>
          {cell.index}
        </text>
      ))}
      <text className="contour-grid-legend" x={first.x + first.width / 2} y={first.y + first.height - LABEL_OFFSET}>
        case de départ
      </text>
    </g>
  );
};

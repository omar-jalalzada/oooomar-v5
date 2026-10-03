import styles from './RoleCardStage.module.css';

interface CellGridProps {
  /** Size of the box the grid fills, in design units. */
  size: { w: number; h: number };
  /** Where cell [0, 0] sits inside that box. */
  origin: { x: number; y: number };
  cell: number;
  /** [column, row] of each drawn cell. */
  cells: [number, number][];
}

/** The 48-unit cell grids the role cards draw on their faces. Stroke colour and dash come from
    the card theme (`--grid-stroke`, `--grid-dash`). */
export function CellGrid({ size, origin, cell, cells }: CellGridProps) {
  return (
    <svg
      className={styles.cells}
      viewBox={`0 0 ${size.w} ${size.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {cells.map(([col, row]) => (
        <rect
          key={`${col}-${row}`}
          x={origin.x + col * cell + 0.5}
          y={origin.y + row * cell + 0.5}
          width={cell - 1}
          height={cell - 1}
        />
      ))}
    </svg>
  );
}

import faceCurves from '../../../assets/work/kin/face-curves.svg?url';
import faceArt from '../../../assets/work/kin/face-art.svg?url';
import faceMask from '../../../assets/work/kin/face-mask.svg?url';
import gridMask from '../../../assets/work/kin/grid-mask.svg?url';
import goop from '../../../assets/work/kin/goop.svg?url';
import logoTile from '../../../assets/work/kin/logo-tile.svg?url';
import logoMark from '../../../assets/work/kin/logo-mark.svg?url';
import screenStats from '../../../assets/work/kin/screen-stats.png?url';
import screenFeed from '../../../assets/work/kin/screen-feed.png?url';
import screenHabits from '../../../assets/work/kin/screen-habits.png?url';
import type { CSSProperties } from 'react';
import { CellGrid } from '../CellGrid';
import { ParallaxLayer, type Depth } from '../ParallaxLayer';
import { RoleCardStage, place, stageStyles, type Box } from '../RoleCardStage';
import styles from './KinCard.module.css';

/* Geometry is Figma node 75:388 ("proj_card_bg_kin"), in its 1188 × 554 frame units. */
const FRAME = {
  face: { x: 50, y: 63.994, w: 1088, h: 424.005 },
  curves: { x: 51, y: 63.994, w: 1087, h: 423.005 },
  // The hill in front of the figure is baked into this mask, so the mask stays with the face
  // while the artwork drifts behind it.
  figureMask: { x: 58, y: -127, w: 846.71, h: 680 },
  figureArt: { x: 154.498, y: 126.993, w: 491.17, h: 552.007 },
  grid: { x: 51, y: 90.994, w: 442, h: 396.008 },
  goop: { x: 0, y: -1, w: 442, h: 397.005 },
  screenStats: { x: 628, y: 118.548, w: 148, h: 319 },
  screenFeed: { x: 945, y: 118.548, w: 149, h: 319 },
  screenHabits: { x: 749, y: 34, w: 224, h: 482 },
} satisfies Record<string, Box>;

/* The grid is a staircase of 48-unit cells, clipped to the hill: each row's cell count, counted
   from the left. The first row sits 34 units above the clip box. */
const GRID_ROWS = [3, 3, 3, 6, 8, 9, 10, 10, 11];
const GRID = {
  cell: 48,
  origin: { x: -2, y: -34 },
  cells: GRID_ROWS.flatMap((count, row) =>
    Array.from({ length: count }, (_, col): [number, number] => [col, row]),
  ),
};

/* Depth planes. The face, its curves and the grid are the card itself and never move. */
const DEPTH = {
  figure: { scroll: -14, pointer: -4 },
  sideScreens: { scroll: 22, pointer: 7 },
  heroScreen: { scroll: 40, pointer: 10 },
} satisfies Record<string, Depth>;

const CAPTION = {
  box: { x: 96, y: 248.996, w: 299 },
  logoSize: 96,
  gap: 30,
};

// Starts at the face's top edge, so the crop continues the caption's ground.
const COMPACT_VIEW: Box = { x: 200, y: 64, w: 937, h: 490 };

const THEME = {
  '--caption-ink': 'var(--kin-ink)',
  '--caption-ground': 'var(--kin-face)',
  '--grid-stroke': 'var(--kin-grid)',
} as CSSProperties;

export default function KinCard({ statement }: { statement: string }) {
  const logo = (
    <>
      <img src={logoTile} alt="" className={styles.logoTile} />
      <img src={logoMark} alt="Kin" className={styles.logoMark} />
    </>
  );

  return (
    <RoleCardStage
      caption={{ ...CAPTION, logo, statement }}
      compactView={COMPACT_VIEW}
      theme={THEME}
    >
      <div aria-hidden="true">
        <div className={`${stageStyles.place} ${styles.face}`} style={place(FRAME.face)} />
        <div className={stageStyles.place} style={place(FRAME.curves)}>
          <img src={faceCurves} alt="" />
        </div>

        <div
          className={`${stageStyles.place} ${styles.masked}`}
          style={{ ...place(FRAME.figureMask), '--mask': `url("${faceMask}")` } as CSSProperties}
        >
          <ParallaxLayer
            depth={DEPTH.figure}
            className={stageStyles.place}
            style={place(FRAME.figureArt)}
          >
            <img src={faceArt} alt="" />
          </ParallaxLayer>
        </div>

        <div
          className={`${stageStyles.place} ${styles.masked}`}
          style={{ ...place(FRAME.grid), '--mask': `url("${gridMask}")` } as CSSProperties}
        >
          <CellGrid size={FRAME.grid} {...GRID} />
          <div className={stageStyles.place} style={place(FRAME.goop)}>
            <img src={goop} alt="" />
          </div>
        </div>
      </div>

      <ParallaxLayer depth={DEPTH.sideScreens}>
        <div className={stageStyles.place} style={place(FRAME.screenStats)}>
          <img
            src={screenStats}
            alt="Kin stats: weekly completion rate and a daily report for each habit"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={stageStyles.place} style={place(FRAME.screenFeed)}>
          <img
            src={screenFeed}
            alt="Kin activity feed, where friends share progress on their habits"
            loading="lazy"
            decoding="async"
          />
        </div>
      </ParallaxLayer>

      <ParallaxLayer depth={DEPTH.heroScreen}>
        <div
          className={`${stageStyles.place} ${styles.heroScreen}`}
          style={place(FRAME.screenHabits)}
        >
          <img
            src={screenHabits}
            alt="Kin habits dashboard with meditate, gratitude journal, sleep routine and read habits"
            loading="lazy"
            decoding="async"
          />
        </div>
      </ParallaxLayer>
    </RoleCardStage>
  );
}

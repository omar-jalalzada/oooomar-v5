import polygons from '../../../assets/work/coatue/polygons.svg?url';
import iconShield from '../../../assets/work/coatue/icon-shield.png?url';
import iconPie from '../../../assets/work/coatue/icon-pie.png?url';
import iconDisc from '../../../assets/work/coatue/icon-disc.png?url';
import iconGear from '../../../assets/work/coatue/icon-gear.png?url';
import iconNetwork from '../../../assets/work/coatue/icon-network.png?url';
import iconChart from '../../../assets/work/coatue/icon-chart.png?url';
import screenIpad from '../../../assets/work/coatue/screen-ipad.png?url';
import screenDashboard from '../../../assets/work/coatue/screen-dashboard.png?url';
import screenIphone from '../../../assets/work/coatue/screen-iphone.png?url';
import logoMosaic from '../../../assets/work/coatue/logo-mosaic.png?url';
import type { CSSProperties } from 'react';
import { CellGrid } from '../CellGrid';
import { ParallaxLayer, type Depth } from '../ParallaxLayer';
import { RoleCardStage, place, stageStyles, type Box } from '../RoleCardStage';
import styles from './CoatueCard.module.css';

/* Geometry is Figma node 75:36 ("proj_card_bg_coatue"), in its 1188 × 554 frame units. */
const FRAME = {
  face: { x: 50, y: 80, w: 1088, h: 424 },
  grid: { x: 51, y: 81, w: 1086, h: 422 },
  gridFade: { x: -1, y: -1, w: 530, h: 424 },
  polygons: { x: 147.857, y: -111, w: 980.539, h: 608.747 },
  // The iPad is clipped at the face's bottom edge. The clip belongs to the card, so it stays
  // put while the iPad moves inside it.
  ipadClip: { x: 356, y: 253, w: 218, h: 251 },
  screenIpad: { x: 40, y: 66, w: 155, h: 206 },
  screenDashboard: { x: 497, y: 220, w: 545, h: 307 },
  screenIphone: { x: 994, y: 282, w: 97, h: 171 },
} satisfies Record<string, Box>;

/* The floating 3D objects around the collage. `turn` is how Figma set each one. */
const ICONS: { src: string; box: Box; turn?: 'quarter' | 'flipY' }[] = [
  { src: iconShield, box: { x: 280, y: 465, w: 73, h: 84 } },
  { src: iconPie, box: { x: 996, y: 466, w: 93, h: 93 } },
  { src: iconDisc, box: { x: 1033, y: 40, w: 58, h: 58 }, turn: 'quarter' },
  { src: iconGear, box: { x: 514, y: 7, w: 131, h: 117 }, turn: 'flipY' },
  { src: iconNetwork, box: { x: 937, y: 129, w: 69.643, h: 60 } },
  { src: iconChart, box: { x: 738, y: 109, w: 43, h: 60 } },
];

/* Dashed 48-unit cells, sparse toward the bottom right: the columns drawn in each row. */
const GRID_ROWS = [
  [0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1, 2, 3, 4, 5, 6, 7, 9, 10],
  [0, 1, 2, 3, 4, 5, 6, 9, 10],
  [0, 1, 2, 3, 4, 5, 8, 9, 10],
  [0, 1, 2, 3, 7, 8, 9],
  [0, 1, 2],
];
const GRID = {
  cell: 48,
  origin: { x: -1, y: -1 },
  cells: GRID_ROWS.flatMap((cols, row) => cols.map((col): [number, number] => [col, row])),
};

/* Depth planes. The face, grid and hexagons are the card itself and never move; the objects
   float just off it, and the screens stack forward from the iPad to the iPhone. */
const DEPTH = {
  objects: { scroll: 10, pointer: 4 },
  ipad: { scroll: 16, pointer: 6 },
  dashboard: { scroll: 26, pointer: 9 },
  iphone: { scroll: 36, pointer: 12 },
} satisfies Record<string, Depth>;

const CAPTION = {
  box: { x: 98, y: 128, w: 280 },
  logoSize: 97,
  gap: 28,
};

// Starts at the iPad's clip and ends at the face's bottom edge, keeping the gear and the other
// objects that escape above the face.
const COMPACT_VIEW: Box = { x: 356, y: 0, w: 782, h: 504 };

const THEME = {
  '--caption-ink': 'var(--coatue-ink)',
  '--caption-ground': 'var(--coatue-face)',
  '--grid-stroke': 'var(--coatue-grid)',
  '--grid-dash': '3 3',
} as CSSProperties;

function Screen({ box, src, alt, className }: { box: Box; src: string; alt: string; className: string }) {
  return (
    <div className={`${stageStyles.place} ${styles.screen} ${className}`} style={place(box)}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

export default function CoatueCard({ statement }: { statement: string }) {
  const logo = (
    <span className={styles.logoTile}>
      <img src={logoMosaic} alt="Mosaic" className={styles.logoMark} />
    </span>
  );

  return (
    <RoleCardStage
      caption={{ ...CAPTION, logo, statement }}
      compactView={COMPACT_VIEW}
      compactCaption="below"
      theme={THEME}
    >
      <div aria-hidden="true">
        <div className={`${stageStyles.place} ${styles.face}`} style={place(FRAME.face)} />
        <div className={`${stageStyles.place} ${styles.gridClip}`} style={place(FRAME.grid)}>
          <CellGrid size={FRAME.grid} {...GRID} />
          <div className={`${stageStyles.place} ${styles.gridFade}`} style={place(FRAME.gridFade)} />
          <div className={stageStyles.place} style={place(FRAME.polygons)}>
            <img src={polygons} alt="" />
          </div>
        </div>
      </div>

      <ParallaxLayer depth={DEPTH.objects}>
        <div aria-hidden="true">
          {ICONS.map(({ src, box, turn }) => (
            <div
              key={src}
              className={`${stageStyles.place} ${styles.icon} ${turn ? styles[turn] : ''}`}
              style={place(box)}
            >
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </ParallaxLayer>

      <div className={`${stageStyles.place} ${styles.ipadClip}`} style={place(FRAME.ipadClip)}>
        <ParallaxLayer depth={DEPTH.ipad}>
          <Screen
            box={FRAME.screenIpad}
            src={screenIpad}
            alt="Mosaic on iPad: search results across research and tickers"
            className={styles.ipad}
          />
        </ParallaxLayer>
      </div>

      <ParallaxLayer depth={DEPTH.dashboard}>
        <Screen
          box={FRAME.screenDashboard}
          src={screenDashboard}
          alt="The Mosaic dashboard: portfolio performance, exposure charts and positions"
          className={styles.dashboard}
        />
      </ParallaxLayer>

      <ParallaxLayer depth={DEPTH.iphone}>
        <Screen
          box={FRAME.screenIphone}
          src={screenIphone}
          alt="Mosaic on iPhone: research on a single company"
          className={styles.iphone}
        />
      </ParallaxLayer>
    </RoleCardStage>
  );
}

import artPatient from '../../../assets/work/alto/art-patient.png?url';
import artPharmacist from '../../../assets/work/alto/art-pharmacist.png?url';
import screenWunderbar from '../../../assets/work/alto/screen-wunderbar.png?url';
import screenPatientApp from '../../../assets/work/alto/screen-patient-app.png?url';
import logoImage from '../../../assets/work/alto/logo.png?url';
import type { CSSProperties } from 'react';
import { CellGrid } from '../CellGrid';
import { ParallaxLayer, type Depth } from '../ParallaxLayer';
import { RoleCardStage, place, stageStyles, type Box } from '../RoleCardStage';
import styles from './AltoCard.module.css';

/* Geometry is Figma node 75:292 ("proj_card_bg_alto"), in its 1188 × 554 frame units. */
const FRAME = {
  face: { x: 50, y: 81, w: 1088, h: 424 },
  grid: { x: 51, y: 82.009, w: 1086, h: 422 },
  gridFade: { x: -1, y: -1.009, w: 1088, h: 424 },
  // Both illustrations are cut flat along the face's edges (the patient's table on its bottom
  // edge, the pharmacist's counter on its right), so they belong to the card and stay put.
  artPatient: { x: 51, y: 341, w: 237, h: 164 },
  potFade: { x: 247, y: 482, w: 76, h: 23 },
  artPharmacist: { x: 721, y: 1, w: 417, h: 248 },
  screenWunderbar: { x: 505, y: 209, w: 619, h: 346 },
  screenPatientApp: { x: 447, y: 271, w: 101, h: 219 },
} satisfies Record<string, Box>;

/* A full 11 × 7 block of 48-unit cells. One cell is drawn 39 units low in Figma; kept as drawn. */
const GRID = {
  cell: 48,
  origin: { x: -1, y: -1.009 },
  cells: Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 11 }, (_, col): [number, number] => [
      col,
      col === 3 && row === 3 ? row + 39 / 48 : row,
    ]),
  ).flat(),
};

const DEPTH = {
  dashboard: { scroll: 22, pointer: 7 },
  phone: { scroll: 36, pointer: 12 },
} satisfies Record<string, Depth>;

const CAPTION = {
  box: { x: 97, y: 128, w: 312 },
  logoSize: 97,
  gap: 30,
};

// Starts right of the patient illustration and ends at the face's bottom edge, where the
// dashboard tucks under the caption. The pharmacist keeps her escape above the face.
const COMPACT_VIEW: Box = { x: 300, y: 0, w: 838, h: 505 };

const THEME = {
  '--caption-ink': 'var(--alto-ink)',
  '--caption-ground': 'var(--alto-face)',
  '--grid-stroke': 'var(--alto-grid)',
} as CSSProperties;

/** A screenshot shown through a cropping window: `crop` is the image's box as percentages of
    the window, straight from Figma's fill settings. */
function crop(left: number, top: number, width: number, height: number): CSSProperties {
  return {
    '--crop-l': `${left}%`,
    '--crop-t': `${top}%`,
    '--crop-w': `${width}%`,
    '--crop-h': `${height}%`,
  } as CSSProperties;
}

export default function AltoCard({ statement }: { statement: string }) {
  const logo = <img src={logoImage} alt="Alto" className={styles.logo} />;

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
        </div>
        <div className={`${stageStyles.place} ${styles.flipped}`} style={place(FRAME.artPatient)}>
          <img src={artPatient} alt="" />
        </div>
        <div className={`${stageStyles.place} ${styles.potFade}`} style={place(FRAME.potFade)} />
        <div
          className={`${stageStyles.place} ${styles.flipped}`}
          style={place(FRAME.artPharmacist)}
        >
          <img src={artPharmacist} alt="" />
        </div>
      </div>

      <ParallaxLayer depth={DEPTH.dashboard}>
        <div
          className={`${stageStyles.place} ${styles.screen} ${styles.dashboard}`}
          style={{ ...place(FRAME.screenWunderbar), ...crop(-7.65, -13.1, 118.14, 142.24) }}
        >
          <img
            src={screenWunderbar}
            alt="Wunderbar, Alto's internal pharmacy tool, showing the order check queue"
            className={styles.crop}
            loading="lazy"
            decoding="async"
          />
        </div>
      </ParallaxLayer>

      <ParallaxLayer depth={DEPTH.phone}>
        <div
          className={`${stageStyles.place} ${styles.screen} ${styles.phone}`}
          style={{ ...place(FRAME.screenPatientApp), ...crop(-25.07, -11.08, 150.13, 123.15) }}
        >
          <img
            src={screenPatientApp}
            alt="The Alto patient app showing a prescription with its directions and price"
            className={styles.crop}
            loading="lazy"
            decoding="async"
          />
        </div>
      </ParallaxLayer>
    </RoleCardStage>
  );
}

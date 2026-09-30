import screenHome from '../../../assets/work/macys/screen-home.jpg?url';
import screenBrowse from '../../../assets/work/macys/screen-browse.png?url';
import screenBloomingdales from '../../../assets/work/macys/screen-bloomingdales.jpg?url';
import priceTag from '../../../assets/work/macys/price-tag.png?url';
import productTile from '../../../assets/work/macys/product-tile.png?url';
import type { CSSProperties, ReactNode } from 'react';
import { CellGrid } from '../CellGrid';
import { ParallaxLayer, type Depth } from '../ParallaxLayer';
import { RoleCardStage, place, stageStyles, type Box } from '../RoleCardStage';
import styles from './MacysCard.module.css';

/* There's no Figma frame for this one. It's composed in the same 1188 × 554 units as the
   others, so the face, caption and depth planes line up with them down the page. */
const FRAME = {
  face: { x: 50, y: 80, w: 1088, h: 424 },
  grid: { x: 51, y: 81, w: 1086, h: 422 },
  gridFade: { x: -1, y: -1, w: 620, h: 424 },
  // The house star, drawn large and tone on tone behind the screens, in grid space.
  star: { x: 500, y: -90, w: 640, h: 620 },
  // Three phones on one centre line (y 298), the two side screens tucked behind the home screen.
  screenBloomingdales: { x: 550, y: 138.5, w: 180, h: 319 },
  screenHome: { x: 658, y: 110, w: 212, h: 376 },
  screenBrowse: { x: 798, y: 138.5, w: 180, h: 319 },
} satisfies Record<string, Box>;

type Artifact = { key: string; box: Box; depth: Depth; kind: 'card' | 'star' | 'bag'; src?: string };

/* The floating pieces, each lifted from the redesign: the price callout and the
   recommendation tile from the product page. The stars and the bag are drawn. They sit across
   the seams between the phones on a diagonal: bag high left, price low left, tile low right.
   Nearer pieces sit on higher depths. */
const ARTIFACTS: Artifact[] = [
  { key: 'price', kind: 'card', src: priceTag, box: { x: 586, y: 350, w: 112, h: 111 }, depth: { scroll: 46, pointer: 15 } },
  { key: 'tile', kind: 'card', src: productTile, box: { x: 936, y: 268, w: 92, h: 141 }, depth: { scroll: 42, pointer: 14 } },
  { key: 'bag', kind: 'bag', box: { x: 500, y: 72, w: 64, h: 78 }, depth: { scroll: 36, pointer: 12 } },
  { key: 'star-top', kind: 'star', box: { x: 1000, y: 104, w: 26, h: 26 }, depth: { scroll: 24, pointer: 8 } },
  { key: 'star-right', kind: 'star', box: { x: 500, y: 262, w: 20, h: 20 }, depth: { scroll: -6, pointer: -2 } },
  { key: 'star-low', kind: 'star', box: { x: 894, y: 470, w: 20, h: 20 }, depth: { scroll: 30, pointer: 10 } },
];

/* The side screens share a plane behind the Macy's home screen. */
const DEPTH = {
  sides: { scroll: 16, pointer: 6 },
  home: { scroll: 32, pointer: 11 },
} satisfies Record<string, Depth>;

const GRID = {
  cell: 48,
  origin: { x: -1, y: -1 },
  cells: Array.from({ length: 9 * 23 }, (_, i): [number, number] => [i % 23, Math.floor(i / 23)]),
};

const CAPTION = {
  box: { x: 98, y: 128, w: 300 },
  logoSize: 97,
  gap: 28,
};

// Centred on the phones and ending at the face's bottom edge, so the compact caption panel
// below meets the face with no white band between them.
const COMPACT_VIEW: Box = { x: 470, y: 64, w: 604, h: 440 };

const THEME = {
  '--caption-ink': 'var(--macys-ink)',
  '--caption-ground': 'var(--macys-face)',
  '--grid-stroke': 'var(--macys-grid)',
} as CSSProperties;

/* A regular five-point star in a 100-unit box, the proportions of the Macy's mark. */
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 19.1 : 50;
  const a = (Math.PI / 5) * i - Math.PI / 2;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(52.5 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={STAR} />
    </svg>
  );
}

function Bag() {
  return (
    <svg viewBox="0 0 70 86" className={styles.bagArt} aria-hidden="true">
      <path className={styles.bagHandle} d="M23 32V21a12 12 0 0 1 24 0v11" />
      <rect className={styles.bagBody} x="3" y="26" width="64" height="58" rx="3" />
      <g transform="translate(21 41) scale(0.28)">
        <polygon className={styles.bagStar} points={STAR} />
      </g>
    </svg>
  );
}

function Screen({ box, src, alt, className }: { box: Box; src: string; alt: string; className?: string }) {
  return (
    <div className={`${stageStyles.place} ${styles.screen} ${className ?? ''}`} style={place(box)}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

function artifact({ kind, src }: Artifact): ReactNode {
  if (kind === 'star') return <Star className={styles.floatStar} />;
  if (kind === 'bag') return <Bag />;
  return <img src={src} alt="" loading="lazy" decoding="async" />;
}

export default function MacysCard({ statement }: { statement: string }) {
  const logo = (
    <span className={styles.logoTile}>
      <Star className={styles.logoMark} />
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
          <div className={stageStyles.place} style={place(FRAME.star)}>
            <Star className={styles.houseStar} />
          </div>
        </div>
      </div>

      <ParallaxLayer depth={DEPTH.sides}>
        <Screen
          box={FRAME.screenBloomingdales}
          src={screenBloomingdales}
          alt="The reimagined Bloomingdale's app: an editorial home page"
          className={styles.side}
        />
        <Screen
          box={FRAME.screenBrowse}
          src={screenBrowse}
          alt="Macy's product list: coats and jackets with ratings, prices and colours"
          className={styles.side}
        />
      </ParallaxLayer>

      <ParallaxLayer depth={DEPTH.home}>
        <Screen
          box={FRAME.screenHome}
          src={screenHome}
          alt="The Macy's home screen: a full-screen seasonal story with search and Start Shopping"
          className={styles.hero}
        />
      </ParallaxLayer>

      {ARTIFACTS.map((item) => (
        <ParallaxLayer key={item.key} depth={item.depth}>
          <div aria-hidden="true" className={`${stageStyles.place} ${styles[item.kind] ?? ''}`} style={place(item.box)}>
            {artifact(item)}
          </div>
        </ParallaxLayer>
      ))}
    </RoleCardStage>
  );
}

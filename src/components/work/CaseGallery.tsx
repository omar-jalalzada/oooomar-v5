import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  useVelocity,
} from 'motion/react';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './CaseGallery.module.css';

export type GalleryKind = 'web' | 'ipad' | 'iphone' | 'system' | 'process';

export interface GalleryItem {
  thumb: string;
  full: string;
  w: number;
  h: number;
  alt: string;
  kind: GalleryKind;
  /** Already shown on a device's screen, so the grid under it leaves it out. */
  onScreen?: boolean;
}

export type LaneId = 'web' | 'ipad' | 'iphone' | 'system';
export type Device = 'imac' | 'ipad' | 'iphone';

export interface ShowcaseScreen {
  label: string;
  src: string;
  alt: string;
  /** Positions and widths are percents of the screen; `ratio` is a reveal's height over width. */
  hotspots: {
    label: string;
    x: number;
    y: number;
    reveals: { src: string; alt: string; x: number; y: number; w: number; ratio: number; surface?: boolean }[];
  }[];
}

export interface Showcase {
  lane: LaneId;
  device: Device;
  grid: boolean;
  screens: ShowcaseScreen[];
}

const LANES: { id: LaneId; label: string; kinds: GalleryKind[]; size: 'wide' | 'tall' | 'small'; speed: number }[] = [
  { id: 'web', label: 'Web', kinds: ['web'], size: 'wide', speed: 38 },
  { id: 'ipad', label: 'iPad', kinds: ['ipad'], size: 'tall', speed: -30 },
  { id: 'iphone', label: 'iPhone', kinds: ['iphone'], size: 'tall', speed: 30 },
  { id: 'system', label: 'Design system and process', kinds: ['system', 'process'], size: 'small', speed: 44 },
];

/* Each device's screen height over its width: a 16:9 iMac, a 3:4 iPad held upright, and the
   16:9 iPhone of the era, also upright. Converts a reveal's width percent into height percent. */
const SCREEN_RATIO: Record<Device, number> = { imac: 9 / 16, ipad: 4 / 3, iphone: 16 / 9 };

const WALL_COLUMNS = 10;

/* Scroll velocity multiplies every marquee's speed, up to this factor, so a flick of the wheel
   sends the whole body of work rushing past and then lets it settle back to its drift. */
const MAX_BOOST = 7;
const HOVER_FACTOR = 0.12;

/* A track that loops forever along one axis. It holds two identical copies of its content and
   wraps its offset at one copy's length, so the seam never shows. */
function Marquee({
  axis,
  speed,
  className,
  render,
  active,
}: {
  axis: 'x' | 'y';
  speed: number;
  className?: string;
  render: (copy: 0 | 1) => ReactNode;
  /** Overrides the marquee's own visibility check. Inside the wall's 3D plane that check never
      reports an intersection, so the wall passes its own down. */
  active?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const copy = useRef(0);
  const hovered = useRef(false);
  const offset = useMotionValue(0);
  const reduced = useReducedMotion();
  const ownInView = useInView(viewport, { margin: '200px' });
  const inView = active ?? ownInView;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      copy.current = (axis === 'x' ? el.scrollWidth : el.scrollHeight) / 2;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [axis]);

  useAnimationFrame((_, delta) => {
    const length = copy.current;
    if (reduced || !inView || !length) return;
    const boost = 1 + Math.min(Math.abs(velocity.get()) / 300, MAX_BOOST - 1);
    const factor = hovered.current ? HOVER_FACTOR : 1;
    const next = offset.get() - (speed * boost * factor * delta) / 1000;
    offset.set((((next % length) - length) % length));
  });

  return (
    <div
      ref={viewport}
      className={`${styles.viewport} ${className ?? ''}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <motion.div
        ref={track}
        className={axis === 'x' ? styles.trackX : styles.trackY}
        style={axis === 'x' ? { x: offset } : { y: offset }}
      >
        <div className={axis === 'x' ? styles.copyX : styles.copyY}>{render(0)}</div>
        <div className={axis === 'x' ? styles.copyX : styles.copyY} aria-hidden="true">
          {render(1)}
        </div>
      </motion.div>
    </div>
  );
}

function Tile({
  item,
  copy,
  onOpen,
  className,
}: {
  item: GalleryItem;
  copy: 0 | 1;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${className ?? ''}`}
      style={{ aspectRatio: `${item.w} / ${item.h}` }}
      onClick={onOpen}
      tabIndex={copy === 1 ? -1 : undefined}
      aria-label={copy === 1 ? undefined : `Open: ${item.alt}`}
    >
      <img src={item.thumb} alt="" width={item.w} height={item.h} loading="lazy" decoding="async" />
    </button>
  );
}

/* Repeats a list until one copy holds at least `min` entries, so a short lane still spans a
   wide screen before it loops. */
function fill<T>(list: T[], min: number): T[] {
  if (!list.length) return list;
  const times = Math.max(1, Math.ceil(min / list.length));
  return Array.from({ length: times }, () => list).flat();
}

/* Deals the screens into columns from alternating kinds, so every column mixes desktop,
   devices and system work instead of one column being all dashboards. */
function wallColumns(items: GalleryItem[]): GalleryItem[][] {
  const byKind = new Map<GalleryKind, GalleryItem[]>();
  for (const item of items) byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item]);
  const queues = [...byKind.values()];
  const mixed: GalleryItem[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) mixed.push(q.shift()!);
  const columns = Array.from({ length: WALL_COLUMNS }, () => [] as GalleryItem[]);
  mixed.forEach((item, i) => columns[i % WALL_COLUMNS].push(item));
  return columns.map((column) => fill(column, 8));
}

/* Deals the screens into columns tallest first, each to the shortest column so far, then puts each
   column back in gallery order. Relative heights are enough, since every column is the same width.
   Takes the most columns that still end within a quarter of each other: three screens where one
   is twice as tall as the others sit better as two columns than as one tower beside two stubs. */
const GRID_COLUMNS = 3;
const GRID_GAP = 0.06;
const GRID_TOLERANCE = 0.25;

function dealColumns(items: GalleryItem[], count: number) {
  const columns = Array.from({ length: count }, () => ({ height: 0, items: [] as GalleryItem[] }));
  const byHeight = [...items].sort((a, b) => b.h / b.w - a.h / a.w);
  for (const item of byHeight) {
    const shortest = columns.reduce((min, column) => (column.height < min.height ? column : min));
    shortest.height += item.h / item.w + GRID_GAP;
    shortest.items.push(item);
  }
  return columns;
}

function gridColumns(items: GalleryItem[]): GalleryItem[][] {
  const most = Math.min(GRID_COLUMNS, items.length);
  let columns = dealColumns(items, most);
  for (let count = most; count >= 2; count--) {
    const dealt = dealColumns(items, count);
    const heights = dealt.map((column) => column.height);
    if ((Math.max(...heights) - Math.min(...heights)) / Math.max(...heights) <= GRID_TOLERANCE) {
      columns = dealt;
      break;
    }
  }
  return columns.map((column) => column.items.sort((a, b) => items.indexOf(a) - items.indexOf(b)));
}

function ScreenGrid({
  items,
  device,
  onOpen,
}: {
  items: GalleryItem[];
  device: Device;
  onOpen: (item: GalleryItem) => void;
}) {
  const columns = gridColumns(items.filter((item) => !item.onScreen));
  if (!columns.length) return null;
  return (
    <div className={styles.grid} data-device={device} style={{ '--columns': columns.length } as CSSProperties}>
      {columns.map((column, c) => (
        <div key={c} className={styles.gridColumn}>
          {column.map((item) => (
            <Tile key={item.full} item={item} copy={0} onOpen={() => onOpen(item)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Lightbox({ items, index, onChange }: { items: GalleryItem[]; index: number | null; onChange: (i: number | null) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = index === null ? null : items[index];

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (index !== null && !el.open) el.showModal();
    if (index === null && el.open) el.close();
  }, [index]);

  const step = (by: number) => index !== null && onChange((index + by + items.length) % items.length);

  return (
    <dialog
      ref={dialog}
      className={styles.lightbox}
      onClose={() => onChange(null)}
      onClick={(event) => event.target === dialog.current && onChange(null)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1);
        if (event.key === 'ArrowLeft') step(-1);
      }}
    >
      {item && (
        <figure className={styles.lightboxFigure}>
          <img src={item.full} alt={item.alt} width={item.w} height={item.h} />
          <figcaption>
            <span>{item.alt}</span>
            <span className={styles.counter}>
              {index! + 1} / {items.length}
            </span>
          </figcaption>
        </figure>
      )}
      <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Previous screen">
        ←
      </button>
      <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="Next screen">
        →
      </button>
      <button type="button" className={styles.close} onClick={() => onChange(null)} aria-label="Close">
        ×
      </button>
    </dialog>
  );
}

/* Full screens in a drawn device, sliding across like desktops when a tab switches them: the
   iMac carries its tabs on its chin, the handhelds under them. A screen's pulsing hotspots open
   the dialogs behind its controls, at the screen's own scale. One hotspot is open at a time;
   clicking the screen, the same hotspot or Escape closes it. */
function DeviceShowcase({ showcase }: { showcase: Showcase }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();
  const { device } = showcase;
  const screenRatio = SCREEN_RATIO[device];
  const screen = showcase.screens[current];
  const open = active === null ? null : screen.hotspots[active];

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  // The other screens slide in fully drawn rather than loading mid-slide.
  useEffect(() => {
    for (const { src } of showcase.screens.slice(1)) new Image().src = src;
  }, [showcase]);

  const show = (next: number, focus = false) => {
    const count = showcase.screens.length;
    const index = (next + count) % count;
    if (index === current) return;
    setDirection(next > current ? 1 : -1);
    setCurrent(index);
    setActive(null);
    if (focus) tabs.current[index]?.focus();
  };

  const display = (
    <div className={styles.screen} style={{ aspectRatio: `1 / ${screenRatio}` }}>
      <div className={styles.screenTrack} id={panelId} role="tabpanel" aria-label={screen.label}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={current}
            src={screen.src}
            alt={screen.alt}
            className={styles.screenImage}
            decoding="async"
            custom={direction}
            variants={{
              enter: (dir: number) => (reduced ? { opacity: 0 } : { x: `${dir * 100}%` }),
              center: { x: '0%', opacity: 1 },
              exit: (dir: number) => (reduced ? { opacity: 0 } : { x: `${dir * -100}%` }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 260, damping: 32 }}
          />
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            className={styles.scrim}
            onClick={() => setActive(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          />
        )}
        {open?.reveals.map((reveal, i) => {
          // Each dialog grows out of the hotspot that opened it.
          const height = (reveal.w * reveal.ratio) / screenRatio;
          const originX = ((open.x - reveal.x) / reveal.w) * 100;
          const originY = ((open.y - reveal.y) / height) * 100;
          return (
            <motion.img
              key={`${active}-${i}`}
              src={reveal.src}
              alt={reveal.alt}
              className={styles.reveal}
              data-surface={reveal.surface || undefined}
              style={{
                left: `${reveal.x}%`,
                top: `${reveal.y}%`,
                width: `${reveal.w}%`,
                transformOrigin: `${originX}% ${originY}%`,
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.9, transition: { duration: 0.15 } }}
              transition={
                reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26, delay: i * 0.12 }
              }
            />
          );
        })}
      </AnimatePresence>

      {screen.hotspots.map((hotspot, i) => (
        <button
          key={`${current}-${hotspot.label}`}
          type="button"
          className={styles.hotspot}
          data-active={active === i || undefined}
          data-side={hotspot.x > 50 ? 'left' : 'right'}
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          aria-expanded={active === i}
          aria-label={hotspot.label}
          onClick={() => setActive(active === i ? null : i)}
        >
          <span className={styles.hotspotLabel} aria-hidden="true">
            {hotspot.label}
          </span>
        </button>
      ))}
    </div>
  );

  const screenTabs = showcase.screens.length > 1 && (
    <div
      className={styles.screenTabs}
      role="tablist"
      aria-label="Screens"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') show(current + 1, true);
        if (event.key === 'ArrowLeft') show(current - 1, true);
      }}
    >
      {showcase.screens.map((s, i) => (
        <button
          key={s.label}
          ref={(el) => {
            tabs.current[i] = el;
          }}
          type="button"
          role="tab"
          className={styles.screenTab}
          aria-selected={i === current}
          aria-controls={panelId}
          tabIndex={i === current ? 0 : -1}
          onClick={() => show(i)}
        >
          {i === current && (
            <motion.span
              layoutId={`${panelId}-tab`}
              className={styles.screenTabPill}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className={styles.screenTabLabel}>{s.label}</span>
        </button>
      ))}
    </div>
  );

  if (device === 'imac') {
    return (
      <div className={styles.showcase}>
        <div className={styles.imac}>
          <div className={styles.bezel}>{display}</div>
          {/* The tabs sit on the chin, where the Apple logo would be. */}
          <div className={styles.chin}>{screenTabs}</div>
          <div className={styles.neck} />
          <div className={styles.foot} />
        </div>
      </div>
    );
  }

  // The handhelds are drawn as the Mosaic era's: a front camera above the screen, a home button below.
  return (
    <div className={styles.showcase}>
      <div className={styles.handheld} data-device={device}>
        <div className={styles.handheldBody}>
          <span className={styles.camera} />
          {display}
          <span className={styles.homeButton} />
        </div>
      </div>
      {screenTabs && <div className={styles.tabsBelow}>{screenTabs}</div>}
    </div>
  );
}

export default function CaseGallery({
  items,
  laneLabels,
  showcases = [],
}: {
  items: GalleryItem[];
  laneLabels?: Partial<Record<LaneId, string>>;
  showcases?: Showcase[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const wall = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const wallInView = useInView(wall, { margin: '200px' });
  const { scrollYProgress } = useScroll({ target: wall, offset: ['start end', 'end start'] });
  // The wall comes in steeply tilted and straightens as it passes, without ever lying flat.
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [20, 20, 20] : [42, 22, 10]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [-10, -10, -10] : [-18, -10, -4]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [1.1, 1.1, 1.1] : [1.3, 1.12, 1]);

  const indexOf = new Map(items.map((item, i) => [item, i]));
  const columns = wallColumns(items);

  return (
    <div className={styles.gallery}>
      {LANES.map((lane) => {
        const showcase = showcases.find((s) => s.lane === lane.id);
        const laneItems = items.filter((item) => lane.kinds.includes(item.kind));
        if (!laneItems.length && !showcase) return null;
        const label = laneLabels?.[lane.id] ?? lane.label;
        return (
          <section key={lane.id} className={styles.lane} aria-label={label}>
            <header className={styles.laneHeader}>
              <h2>{label}</h2>
              {!showcase && <span>{laneItems.length} screens</span>}
            </header>
            {/* A lane with a device shows the work in it, plus a still grid of the lane's other
                screens if it asks for one; the wall below still carries every screen. */}
            {showcase ? (
              <>
                <DeviceShowcase showcase={showcase} />
                {showcase.grid && <ScreenGrid items={laneItems} device={showcase.device} onOpen={(item) => setOpen(indexOf.get(item)!)} />}
              </>
            ) : (
              <Marquee
                axis="x"
                speed={lane.speed}
                className={styles[lane.size]}
                render={(copy) =>
                  fill(laneItems, 12).map((item, i) => (
                    <Tile
                      key={i}
                      item={item}
                      copy={copy || i >= laneItems.length ? 1 : 0}
                      onOpen={() => setOpen(indexOf.get(item)!)}
                    />
                  ))
                }
              />
            )}
          </section>
        );
      })}

      {/* The closing flourish: every screen at once, after the lanes have shown them one by one.
          It repeats each screen many times over, so it's for pointers only; the lanes above
          reach each screen once, from the keyboard too. */}
      <section ref={wall} className={styles.wall} aria-hidden="true">
        <motion.div className={styles.plane} style={{ rotateX, rotateZ, scale }}>
          {columns.map((column, c) => (
            <Marquee
              key={c}
              axis="y"
              speed={(c % 2 ? -1 : 1) * (18 + (c % 3) * 7)}
              className={styles.column}
              active={wallInView}
              render={(copy) =>
                column.map((item, i) => (
                  <Tile key={i} item={item} copy={1} onOpen={() => setOpen(indexOf.get(item)!)} />
                ))
              }
            />
          ))}
        </motion.div>
      </section>

      <Lightbox items={items} index={open} onChange={setOpen} />
    </div>
  );
}

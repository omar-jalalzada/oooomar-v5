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
  type Variants,
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
  device: 'imac';
  screens: ShowcaseScreen[];
}

export interface HandheldScreen {
  src: string;
  alt: string;
  /** A cropped dialog centred over the screen; `w` is a percent of the screen's width. */
  overlay?: { src: string; alt: string; w: number; ratio: number };
}

export interface Handhelds {
  label: string;
  chapters: { label: string; ipad?: HandheldScreen; iphone?: HandheldScreen }[];
}

const LANES: { id: LaneId; label: string; kinds: GalleryKind[]; size: 'wide' | 'tall'; speed: number }[] = [
  { id: 'web', label: 'Web', kinds: ['web'], size: 'wide', speed: 38 },
  { id: 'ipad', label: 'iPad', kinds: ['ipad'], size: 'tall', speed: -30 },
  { id: 'iphone', label: 'iPhone', kinds: ['iphone'], size: 'tall', speed: 30 },
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

/* Full screens in a drawn iMac, sliding across like desktops when a tab on its chin switches
   them. A screen's pulsing hotspots open the dialogs behind its controls, at the screen's own
   scale. One hotspot is open at a time; clicking the screen, the same hotspot or Escape closes it. */
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

/* UIKit's navigation push, the transition these apps were built on: the next screen slides in
   over the last, which falls back a third of the way and dims. Going back runs it in reverse. */
const PUSH: Variants = {
  enter: (dir: number) =>
    dir > 0 ? { x: '100%', zIndex: 2, filter: 'brightness(1)' } : { x: '-30%', zIndex: 1, filter: 'brightness(0.55)' },
  center: { x: '0%', filter: 'brightness(1)' },
  exit: (dir: number) =>
    dir > 0 ? { x: '-30%', zIndex: 1, filter: 'brightness(0.55)' } : { x: '100%', zIndex: 2, filter: 'brightness(1)' },
};
const FADE: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };
const PUSH_EASE = [0.32, 0.72, 0, 1] as const;

const HANDHELD_DEVICES = ['ipad', 'iphone'] as const;
type Handheld = (typeof HANDHELD_DEVICES)[number];

/* Seconds a chapter holds, and how far the iPhone trails the iPad: enough that the push reads
   as handed from one device to the other, not as two screens changing at once. */
const DWELL = 3.6;
const HANDOFF = 0.16;

/* The screen a device shows in a chapter: its own, or if the chapter leaves it out, the last one
   it had. The overlay belongs to its chapter only, so a held screen comes without it. */
function screenAt(chapters: Handhelds['chapters'], index: number, device: Handheld) {
  for (let back = 0; back < chapters.length; back++) {
    const screen = chapters[(index - back + chapters.length) % chapters.length][device];
    if (screen) return back === 0 ? screen : { ...screen, overlay: undefined };
  }
  return undefined;
}

// Drawn as the Mosaic era's: a front camera above the screen, a home button below.
function HandheldDevice({
  device,
  screen,
  chapter,
  direction,
  delay,
  onOpen,
}: {
  device: Handheld;
  screen: HandheldScreen;
  chapter: number;
  direction: number;
  delay: number;
  onOpen: (src: string) => void;
}) {
  const reduced = useReducedMotion();
  const screenRatio = SCREEN_RATIO[device];
  const { overlay } = screen;
  const overlayHeight = overlay ? (overlay.w * overlay.ratio) / screenRatio : 0;

  return (
    <div className={styles.handheld} data-device={device}>
      <div className={styles.handheldBody}>
        <span className={styles.camera} />
        <button
          type="button"
          className={`${styles.screen} ${styles.handheldScreen}`}
          style={{ aspectRatio: `1 / ${screenRatio}` }}
          onClick={() => onOpen(screen.src)}
          aria-label={`Open: ${screen.alt}`}
        >
          <span className={styles.screenTrack}>
            {/* Keyed by image, so a chapter that keeps a device's screen doesn't push it again. */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={screen.src}
                src={screen.src}
                alt=""
                className={`${styles.screenImage} ${styles.pushImage}`}
                decoding="async"
                custom={direction}
                variants={reduced ? FADE : PUSH}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduced ? { duration: 0.2 } : { duration: 0.6, ease: PUSH_EASE, delay }}
              />
            </AnimatePresence>
          </span>
          <AnimatePresence>
            {overlay && (
              <motion.span
                key={`scrim-${chapter}`}
                className={styles.overlayScrim}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : delay + 0.45 }}
              />
            )}
            {overlay && (
              <motion.img
                key={`overlay-${chapter}`}
                src={overlay.src}
                alt=""
                className={styles.overlay}
                style={{
                  left: `${(100 - overlay.w) / 2}%`,
                  top: `${(100 - overlayHeight) / 2}%`,
                  width: `${overlay.w}%`,
                }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: '4%' }}
                animate={{ opacity: 1, scale: 1, y: '0%' }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.96, transition: { duration: 0.15 } }}
                transition={
                  reduced ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 26, delay: delay + 0.5 }
                }
              />
            )}
          </AnimatePresence>
        </button>
        <span className={styles.homeButton} />
      </div>
    </div>
  );
}

/* The iPad and the iPhone side by side, telling one story in chapters: each chapter shows the
   same feature on both, pushed in on the iPad and then handed across to the iPhone. A segmented
   rail under them fills while a chapter plays, and its end advances to the next, so pausing the
   fill pauses the story. It holds while it's off screen, under the pointer or keyboard focus, or
   paused by its own button; with reduced motion it doesn't play at all and the rail steps it. */
function HandheldPair({ handhelds, onOpen }: { handhelds: Handhelds; onOpen: (src: string) => void }) {
  const { chapters } = handhelds;
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const segments = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(root, { amount: 0.4 });
  const reduced = useReducedMotion();
  const playing = !reduced && !paused && !held && inView;
  const pad = (n: number) => String(n).padStart(2, '0');

  // Every screen is drawn before its push begins rather than loading mid-slide.
  useEffect(() => {
    for (const chapter of chapters)
      for (const device of HANDHELD_DEVICES) {
        const screen = chapter[device];
        if (screen) new Image().src = screen.src;
        if (screen?.overlay) new Image().src = screen.overlay.src;
      }
  }, [chapters]);

  const go = (next: number, dir: number, focus = false) => {
    const index = (next + chapters.length) % chapters.length;
    if (index === current) return;
    setDirection(dir);
    setCurrent(index);
    if (focus) segments.current[index]?.focus();
  };

  return (
    <div
      ref={root}
      className={styles.pair}
      onFocus={(event) => event.target.matches(':focus-visible') && setHeld(true)}
      onBlur={(event) => !root.current?.contains(event.relatedTarget) && setHeld(false)}
    >
      {/* Only the devices hold it under the pointer: over the rail, the play button has to work. */}
      <div
        className={styles.pairDevices}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setHeld(true)}
        onPointerLeave={() => setHeld(false)}
      >
        {HANDHELD_DEVICES.map((device, d) => {
          const screen = screenAt(chapters, current, device);
          return (
            screen && (
              <HandheldDevice
                key={device}
                device={device}
                screen={screen}
                chapter={current}
                direction={direction}
                delay={d * HANDOFF}
                onOpen={onOpen}
              />
            )
          );
        })}
      </div>

      <div className={styles.chapters}>
        <p className={styles.chapterCaption}>
          <span className={styles.chapterCount}>
            {pad(current + 1)} / {pad(chapters.length)}
          </span>
          <span className={styles.chapterLabel}>
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.span
                key={current}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, y: reduced ? 0 : `${dir * 60}%` }),
                  center: { opacity: 1, y: '0%' },
                  exit: (dir: number) => ({ opacity: 0, y: reduced ? 0 : `${dir * -60}%` }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduced ? 0 : 0.35, ease: PUSH_EASE }}
              >
                {chapters[current].label}
              </motion.span>
            </AnimatePresence>
          </span>
        </p>

        <div className={styles.chapterControls}>
          <div
            className={styles.segments}
            role="tablist"
            aria-label="Chapters"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') go(current + 1, 1, true);
              if (event.key === 'ArrowLeft') go(current - 1, -1, true);
            }}
          >
            {chapters.map((chapter, i) => (
              <button
                key={chapter.label}
                ref={(el) => {
                  segments.current[i] = el;
                }}
                type="button"
                role="tab"
                className={styles.segment}
                aria-selected={i === current}
                aria-label={chapter.label}
                tabIndex={i === current ? 0 : -1}
                onClick={() => go(i, i > current ? 1 : -1)}
              >
                <span
                  key={i === current ? `playing-${current}` : 'idle'}
                  className={styles.segmentFill}
                  data-state={i < current ? 'done' : i === current ? 'current' : undefined}
                  style={{ '--dwell': `${DWELL}s`, animationPlayState: playing ? 'running' : 'paused' } as CSSProperties}
                  onAnimationEnd={i === current ? () => go(current + 1, 1) : undefined}
                />
              </button>
            ))}
          </div>
          {!reduced && (
            <button
              type="button"
              className={styles.playToggle}
              aria-label={paused ? 'Play' : 'Pause'}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              <span aria-hidden="true" data-icon={paused ? 'play' : 'pause'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CaseGallery({
  items,
  laneLabels,
  showcases = [],
  handhelds,
}: {
  items: GalleryItem[];
  laneLabels?: Partial<Record<LaneId, string>>;
  showcases?: Showcase[];
  handhelds?: Handhelds;
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
  // A device's screen is the gallery entry's lightbox image, so the URLs match.
  const openSrc = (src: string) => {
    const index = items.findIndex((item) => item.full === src);
    if (index >= 0) setOpen(index);
  };
  const columns = wallColumns(items);

  return (
    <div className={styles.gallery}>
      {LANES.map((lane) => {
        // The paired handhelds take the iPad lane's place and stand in for the iPhone's too.
        if (handhelds && (lane.id === 'ipad' || lane.id === 'iphone')) {
          return (
            lane.id === 'ipad' && (
              <section key="handhelds" className={styles.lane} aria-label={handhelds.label}>
                <header className={styles.laneHeader}>
                  <h2>{handhelds.label}</h2>
                </header>
                <HandheldPair handhelds={handhelds} onOpen={openSrc} />
              </section>
            )
          );
        }
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
            {/* A lane with a device shows the work in it; the wall below still carries every screen. */}
            {showcase ? (
              <DeviceShowcase showcase={showcase} />
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

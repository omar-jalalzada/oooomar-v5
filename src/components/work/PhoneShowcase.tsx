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
  type MotionValue,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './PhoneShowcase.module.css';

export interface PhoneScreen {
  /** The phone-sized render, a thumb for the strip and the ring, and the lightbox size. */
  screen: string;
  thumb: string;
  full: string;
  /** Height over width of the export. */
  ratio: number;
  label: string;
  alt: string;
}

export interface PhoneFlow {
  title: string;
  summary: string;
  screens: PhoneScreen[];
}

type Opened = { screens: PhoneScreen[]; index: number } | null;

/* The exports are iPhone X screens, 1125 × 2436 with the notch drawn in. Anything much taller
   is a full scroll of one screen, played by scrolling it inside the phone; anything much
   shorter is a cropped card, set on the app's own ground. */
const SCREEN_RATIO = 2436 / 1125;
const isLong = (s: PhoneScreen) => s.ratio > SCREEN_RATIO * 1.1;
const isCard = (s: PhoneScreen) => s.ratio < SCREEN_RATIO * 0.75;

const STEP_MS = 2600;
const LONG_STEP_MS = 6400;
const dwell = (s: PhoneScreen) => (isLong(s) ? LONG_STEP_MS : STEP_MS);

/* UIKit's navigation push: the new screen slides in over the old, which drifts a third of the
   way left and dims under it. */
const IOS_EASE = [0.32, 0.72, 0, 1] as const;
const PUSH: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-30%', filter: `brightness(${dir > 0 ? 1 : 0.7})`, zIndex: dir > 0 ? 2 : 0 }),
  center: { x: '0%', filter: 'brightness(1)', zIndex: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '100%', filter: `brightness(${dir > 0 ? 0.7 : 1})`, zIndex: dir > 0 ? 0 : 2 }),
};
const FADE: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

/* Scroll velocity spins the ring faster, up to this factor, then lets it settle. */
const MAX_BOOST = 8;

function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${styles.phone} ${className ?? ''}`}>
      <div className={styles.body}>
        <div className={styles.screen}>
          {children}
          <span className={styles.notch} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function Screen({ s, src, scrolling = false, decorative = false }: { s: PhoneScreen; src: string; scrolling?: boolean; decorative?: boolean }) {
  const alt = decorative ? '' : s.alt;
  if (isCard(s)) {
    return (
      <div className={styles.cardGround}>
        <img className={styles.card} src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  }
  if (isLong(s)) {
    const travel = (1 - SCREEN_RATIO / s.ratio) * 100;
    return (
      <motion.img
        className={styles.long}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        initial={{ y: '0%' }}
        animate={{ y: scrolling ? `-${travel}%` : '0%' }}
        transition={scrolling ? { delay: 1, duration: (LONG_STEP_MS - 2000) / 1000, ease: 'easeInOut' } : { duration: 0.5, ease: IOS_EASE }}
      />
    );
  }
  return <img className={styles.fill} src={src} alt={alt} loading="lazy" decoding="async" />;
}

/* --- the headline's habit, swapped a character at a time --- */

const WORD_MS = 2600;
const CHAR: Variants = {
  in: { rotateX: -90, y: '0.45em', opacity: 0 },
  show: (k: number) => ({
    rotateX: 0,
    y: '0em',
    opacity: 1,
    transition: { delay: k * 0.035, type: 'spring', stiffness: 260, damping: 20 },
  }),
  out: (k: number) => ({
    rotateX: 90,
    y: '-0.45em',
    opacity: 0,
    transition: { delay: k * 0.02, duration: 0.22, ease: 'easeIn' },
  }),
};

function RotatingWord({ words }: { words: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref);
  const [index, setIndex] = useState(0);
  const word = words[index];

  useEffect(() => {
    if (reduced || !inView) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % words.length), WORD_MS);
    return () => clearTimeout(timer);
  }, [index, inView, reduced, words.length]);

  return (
    <span ref={ref} className={styles.rotor}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={word} className={styles.word} initial="in" animate="show" exit="out">
          {[...word].map((c, k) => (
            <motion.span key={k} className={styles.char} variants={CHAR} custom={k}>
              {c === ' ' ? '\u00a0' : c}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* --- key screens, fanned out --- */

function FanPhone({
  s,
  offset,
  open,
  progress,
  onOpen,
}: {
  s: PhoneScreen;
  offset: number;
  open: boolean;
  progress: MotionValue<number>;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  const depth = 1 - Math.abs(offset) / 4;
  const y = useTransform(progress, [0, 1], reduced ? ['0%', '0%'] : [`${depth * 12}%`, `${-depth * 12}%`]);
  const vars = { '--o': offset, '--z': 10 - Math.round(Math.abs(offset) * 2) } as CSSProperties;

  return (
    <motion.button
      type="button"
      className={styles.fanItem}
      style={vars}
      aria-label={`${s.label}, open full size`}
      initial={reduced ? false : { '--t': 0, opacity: 0 }}
      animate={open ? { '--t': 1, opacity: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 90, damping: 15, delay: 0.15 + Math.abs(offset) * 0.09 }}
      onClick={onOpen}
    >
      <motion.div className={styles.lift} style={{ y }}>
        <Phone>
          <Screen s={s} src={s.screen} decorative />
        </Phone>
      </motion.div>
    </motion.button>
  );
}

function KeyFan({ screens, onOpen }: { screens: PhoneScreen[]; onOpen: (o: Opened) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const mid = (screens.length - 1) / 2;

  return (
    <div ref={ref} className={styles.fan}>
      {screens.map((s, i) => (
        <FanPhone
          key={s.screen}
          s={s}
          offset={i - mid}
          open={inView}
          progress={scrollYProgress}
          onOpen={() => onOpen({ screens, index: i })}
        />
      ))}
    </div>
  );
}

/* --- one flow, played through a phone --- */

function FlowChapter({ flow, index, onOpen }: { flow: PhoneFlow; index: number; onOpen: (o: Opened) => void }) {
  const ref = useRef<HTMLElement>(null);
  const strip = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.5 });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const n = flow.screens.length;
  const current = flow.screens[step];
  const playing = inView && !paused && !reduced;
  const flip = index % 2 === 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      setDir(1);
      setStep((s) => (s + 1) % n);
    }, dwell(current));
    return () => clearTimeout(timer);
  }, [playing, current, n]);

  useEffect(() => {
    const list = strip.current;
    const item = list?.children[step] as HTMLElement | undefined;
    if (!list || !item || !inView) return;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [step, inView, reduced]);

  const go = (i: number) => {
    setDir(i >= step ? 1 : -1);
    setStep(i);
  };

  return (
    <section ref={ref} className={`${styles.chapter} ${flip ? styles.flip : ''}`} aria-labelledby={`flow-${index}`}>
      <motion.div
        className={styles.stage}
        initial={reduced ? false : { opacity: 0, y: 80, rotateY: flip ? -26 : 26, rotateX: 10 }}
        whileInView={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div className={styles.segments} aria-hidden="true">
          {flow.screens.map((s, i) => (
            <span key={s.screen} className={styles.segment}>
              <motion.span
                key={i === step ? `${step}-${playing}` : undefined}
                className={styles.segmentFill}
                initial={false}
                animate={{ scaleX: i < step ? 1 : i > step ? 0 : playing ? [0, 1] : 1 }}
                transition={i === step && playing ? { duration: dwell(s) / 1000, ease: 'linear' } : { duration: 0.2 }}
              />
            </span>
          ))}
        </div>

        <button
          type="button"
          className={styles.stageButton}
          aria-label={`${current.label}, open full size`}
          onClick={() => onOpen({ screens: flow.screens, index: step })}
        >
          <Phone className={styles.big}>
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={step}
                className={styles.slide}
                custom={dir}
                variants={reduced ? FADE : PUSH}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduced ? 0.2 : 0.6, ease: IOS_EASE }}
              >
                <Screen s={current} src={current.screen} scrolling={inView && !reduced && isLong(current)} />
              </motion.div>
            </AnimatePresence>
          </Phone>
        </button>

        <p className={styles.caption}>
          <span className={styles.count}>
            {String(step + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </span>
          {current.label}
        </p>
      </motion.div>

      <motion.div
        className={styles.copy}
        initial={reduced ? false : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.15 }}
      >
        <h3 id={`flow-${index}`} className={styles.title}>
          {flow.title}
        </h3>
        <p className={styles.summary}>{flow.summary}</p>
      </motion.div>

      <motion.div
        className={styles.stripWrap}
        initial={reduced ? false : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.3 }}
      >
        <ol ref={strip} className={styles.strip}>
          {flow.screens.map((s, i) => (
            <li key={s.screen}>
              <button
                type="button"
                className={styles.thumb}
                aria-current={i === step ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${s.label}`}
                onClick={() => go(i)}
              >
                <Phone className={styles.mini}>
                  <Screen s={s} src={s.thumb} decorative />
                </Phone>
                {i === step && (
                  <motion.span
                    layoutId={`flow-ring-${index}`}
                    className={styles.ring}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ol>
      </motion.div>
    </section>
  );
}

/* --- every screen, on a spinning ring --- */

function Ring({ screens }: { screens: PhoneScreen[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { margin: '200px' });
  const angle = useMotionValue(0);
  const reverse = useTransform(angle, (a) => -a * 0.8 + 6);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return;
    const boost = 1 + Math.min(Math.abs(velocity.get()) / 250, MAX_BOOST - 1);
    const factor = hovered.current ? 0.15 : 1;
    angle.set(angle.get() + (delta / 1000) * 5 * boost * factor);
  });

  const half = Math.ceil(screens.length / 2);
  const rows = [screens.slice(0, half), screens.slice(half)];

  return (
    <div
      ref={ref}
      className={styles.ringStage}
      aria-hidden="true"
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      {rows.map((row, r) => (
        <div key={r} className={styles.ringRow} style={{ '--n': row.length } as CSSProperties}>
          <motion.div className={styles.ringSpin} style={{ rotateY: r === 0 ? angle : reverse }}>
            {row.map((s, i) => (
              <div key={s.screen} className={styles.ringItem} style={{ '--i': i } as CSSProperties}>
                <Phone>
                  <Screen s={s} src={s.thumb} decorative />
                </Phone>
              </div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

/* --- full size --- */

function Lightbox({ opened, onClose }: { opened: Opened; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (opened) {
      setIndex(opened.index);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [opened]);

  const screens = opened?.screens ?? [];
  const s = screens[index];
  const move = (by: number) => setIndex((i) => (i + by + screens.length) % screens.length);

  return (
    <dialog
      ref={ref}
      className={styles.lightbox}
      aria-label={s?.label ?? 'Screen'}
      onClose={onClose}
      onClick={(e) => (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') move(1);
        if (e.key === 'ArrowLeft') move(-1);
      }}
    >
      {s && (
        <div className={styles.lightboxInner} data-backdrop="true">
          <img className={styles.lightboxImage} src={s.full} alt={s.alt} />
          <div className={styles.lightboxBar}>
            <button type="button" onClick={() => move(-1)} aria-label="Previous screen">
              ←
            </button>
            <p>
              <span className={styles.count}>
                {index + 1} / {screens.length}
              </span>
              {s.label}
            </p>
            <button type="button" onClick={() => move(1)} aria-label="Next screen">
              →
            </button>
            <button type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export interface Headline {
  lead: string;
  words: string[];
  tail: string;
}

export default function PhoneShowcase({
  logo,
  headline,
  keyScreens,
  flows,
}: {
  logo?: string;
  headline: Headline;
  keyScreens: PhoneScreen[];
  flows: PhoneFlow[];
}) {
  const [opened, setOpened] = useState<Opened>(null);
  const reduced = useReducedMotion();
  const every = [...new Map([...flows.flatMap((f) => f.screens), ...keyScreens].map((s) => [s.screen, s])).values()];

  return (
    <div className={styles.showcase}>
      <section className={styles.intro} aria-labelledby="phone-showcase-title">
        <div className={styles.introCopy}>
          {logo && (
            <motion.img
              className={styles.logo}
              src={logo}
              alt="Kin"
              initial={reduced ? false : { rotate: -120, scale: 0.5, opacity: 0 }}
              whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 70, damping: 14 }}
            />
          )}
          <h2 id="phone-showcase-title" className={styles.headline}>
            <span className="sr-only">
              {headline.lead} {headline.words.join(', ')} {headline.tail}
            </span>
            <span aria-hidden="true">
              {headline.lead} <RotatingWord words={headline.words} />
              <span className={styles.tail}>{headline.tail}</span>
            </span>
          </h2>
        </div>
        <KeyFan screens={keyScreens} onOpen={setOpened} />
      </section>

      <div className={styles.flows}>
        {flows.map((flow, i) => (
          <FlowChapter key={flow.title} flow={flow} index={i} onOpen={setOpened} />
        ))}
      </div>

      <section className={styles.every} aria-labelledby="phone-showcase-every">
        <div className={styles.introCopy}>
          <h2 id="phone-showcase-every" className={styles.eyebrow}>
            Every screen
          </h2>
          <p className={styles.tally}>All {every.length}, designed by me</p>
        </div>
        <Ring screens={every} />
      </section>

      <Lightbox opened={opened} onClose={() => setOpened(null)} />
    </div>
  );
}

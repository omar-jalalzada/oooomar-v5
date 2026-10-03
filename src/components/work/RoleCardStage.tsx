import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
} from 'motion/react';
import styles from './RoleCardStage.module.css';

/* Scroll parallax is the primary motion; the pointer adds a quieter offset on desktop.
   A compact card (narrow container) keeps half the scroll travel and ignores the pointer. */
const MOTION = {
  compactAmplitude: 0.5,
  pointerSpring: { stiffness: 140, damping: 22, mass: 0.6 },
};

/** A rectangle in the card's Figma frame units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Positions an element with the stage's `.place` class; all four values are design units. */
export function place({ x, y, w, h }: Box): CSSProperties {
  return { '--x': `${x}`, '--y': `${y}`, '--w': `${w}`, '--h': `${h}` } as CSSProperties;
}

interface StageMotion {
  progress: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** Rendered px per design unit, so layer offsets scale with the card. */
  unit: MotionValue<number>;
  amplitude: MotionValue<number>;
  still: boolean;
}

const StageContext = createContext<StageMotion | null>(null);

export function useStageMotion(): StageMotion {
  const stage = useContext(StageContext);
  if (!stage) throw new Error('useStageMotion must be used inside <RoleCardStage>');
  return stage;
}

export interface RoleCardStageProps {
  /** The identity block: logo and statement. It never moves. Its height follows the text. */
  caption: {
    logo: ReactNode;
    statement: string;
    box: Omit<Box, 'h'>;
    logoSize: number;
    gap: number;
  };
  /** Crop of the frame shown in the compact layout, where the caption leaves the artwork. */
  compactView: Box;
  /** Which side of the crop the caption sits on in the compact layout: the side the artwork
      doesn't escape from. */
  compactCaption?: 'above' | 'below';
  /** Card palette and type, as CSS custom properties (`--caption-ink`, `--caption-ground`). */
  theme: CSSProperties;
  children: ReactNode;
}

export function RoleCardStage({
  caption,
  compactView,
  compactCaption = 'above',
  theme,
  children,
}: RoleCardStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const still = useReducedMotion() === true;

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'end start'],
  });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, MOTION.pointerSpring);
  const pointerY = useSpring(rawY, MOTION.pointerSpring);
  const unit = useMotionValue(0);
  const amplitude = useMotionValue(1);
  const compact = useRef(false);

  // The layout (full frame vs compact crop) is decided by a container query in CSS; the
  // stage reads the resulting view width back rather than duplicating the breakpoint here.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const css = getComputedStyle(stage);
      const viewW = parseFloat(css.getPropertyValue('--view-w'));
      const frameW = parseFloat(css.getPropertyValue('--role-card-stage-w'));
      compact.current = viewW < frameW;
      unit.set(stage.clientWidth / viewW);
      amplitude.set(compact.current ? MOTION.compactAmplitude : 1);
      if (compact.current) {
        rawX.set(0);
        rawY.set(0);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [unit, amplitude, rawX, rawY]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (still || compact.current || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const view = {
    '--compact-view-x': `${compactView.x}`,
    '--compact-view-y': `${compactView.y}`,
    '--compact-view-w': `${compactView.w}`,
    '--compact-view-h': `${compactView.h}`,
    '--caption-x': `${caption.box.x}`,
    '--caption-y': `${caption.box.y}`,
    '--caption-w': `${caption.box.w}`,
    '--caption-logo': `${caption.logoSize}`,
    '--caption-gap': `${caption.gap}`,
    ...theme,
  } as CSSProperties;

  return (
    <StageContext.Provider
      value={{ progress: scrollYProgress, pointerX, pointerY, unit, amplitude, still }}
    >
      <div className={styles.frame}>
        <figure className={styles.card} style={view} data-compact-caption={compactCaption}>
          <figcaption className={styles.caption}>
            <span className={styles.logo}>{caption.logo}</span>
            <span className={styles.statement}>{caption.statement}</span>
          </figcaption>
          <div
            ref={stageRef}
            className={styles.stage}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <div className={styles.canvas}>{children}</div>
          </div>
        </figure>
      </div>
    </StageContext.Provider>
  );
}

export { styles as stageStyles };

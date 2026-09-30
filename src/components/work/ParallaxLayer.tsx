import type { CSSProperties, ReactNode } from 'react';
import { motion, useTransform } from 'motion/react';
import { stageStyles, useStageMotion } from './RoleCardStage';

/** How far a plane travels, in design units. */
export interface Depth {
  /** Travel across one pass through the viewport. Positive rises past the card (nearer the
      viewer); negative lags behind it (further away). Zero is centred in the viewport. */
  scroll: number;
  /** Offset at full pointer deflection. Positive follows the pointer; negative moves away from
      it, for planes behind the card. Keep its sign matching `scroll`. */
  pointer: number;
}

interface ParallaxLayerProps {
  depth: Depth;
  /** Defaults to a full-frame plane; pass the stage's `.place` class to move a single box. */
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function ParallaxLayer({
  depth,
  className = stageStyles.layer,
  style,
  children,
}: ParallaxLayerProps) {
  const { progress, pointerX, pointerY, unit, amplitude, still } = useStageMotion();

  // Reduced motion still renders a motion.div: the server can't know the preference, so
  // swapping the element on the client would fail hydration. The offsets just stay at zero.
  const x = useTransform(() => (still ? 0 : pointerX.get() * depth.pointer * unit.get()));
  const y = useTransform(() => {
    if (still) return 0;
    const travel = depth.scroll * (1 - progress.get() * 2) * amplitude.get();
    return (travel + pointerY.get() * depth.pointer) * unit.get();
  });

  return (
    <motion.div className={className} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}

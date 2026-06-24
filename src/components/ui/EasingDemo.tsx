import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import styles from './EasingDemo.module.css';

type BezierCurve = [number, number, number, number];

interface EasingEntry {
  token: string;
  label: string;
  description: string;
  curve: BezierCurve;
}

const EASINGS: EasingEntry[] = [
  {
    token: '--ease-pop',
    label: 'Pop',
    description: 'Overshoot spring — the signature curve',
    curve: [0.34, 1.28, 0.4, 1],
  },
  {
    token: '--ease-out',
    label: 'Out',
    description: 'Smooth deceleration — reveals, panel slides',
    curve: [0.2, 0.75, 0.2, 1],
  },
  {
    token: '--ease-in-out',
    label: 'In-Out',
    description: 'Slow in, slow out — flips, modals',
    curve: [0.62, 0.04, 0.22, 1],
  },
  {
    token: '--ease-standard',
    label: 'Standard',
    description: 'General purpose motion',
    curve: [0.4, 0, 0.2, 1],
  },
];

function EasingRow({ token, label, description, curve }: EasingEntry) {
  const [key, setKey] = useState(0);
  const reduced = useReducedMotion();

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <code className={styles.token}>{token}</code>
        <span className={styles.desc}>{description}</span>
        <code className={styles.value}>cubic-bezier({curve.join(', ')})</code>
      </div>

      <div className={styles.track} aria-hidden="true">
        <motion.div
          key={key}
          className={styles.dot}
          initial={{ x: 0 }}
          animate={{ x: reduced ? 0 : 180 }}
          transition={{ duration: reduced ? 0 : 0.65, ease: curve }}
        />
      </div>

      <button
        className={styles.playBtn}
        onClick={() => setKey((k) => k + 1)}
        aria-label={`Replay ${label} easing`}
      >
        ▶
      </button>
    </div>
  );
}

export function EasingDemo() {
  return (
    <div className={styles.demo}>
      {EASINGS.map((e) => (
        <EasingRow key={e.token} {...e} />
      ))}
    </div>
  );
}

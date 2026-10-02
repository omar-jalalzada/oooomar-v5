import { motion, useReducedMotion } from 'motion/react';
import styles from './Card.module.css';

export interface CardProps {
  href: string;
  title: string;
  description: string;
  meta?: string;
  draft?: boolean;
  index?: number;
  look?: 'art-history';
}

export function Card({ href, title, description, meta, draft = false, index = 0, look }: CardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      className={styles.card}
      data-look={look}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.32, delay: index * 0.06, ease: [0.2, 0.75, 0.2, 1] }
      }
      whileHover={
        reduced ? undefined : { y: -3, transition: { type: 'spring', stiffness: 320, damping: 22 } }
      }
    >
      {look === 'art-history' && (
        <span className={styles.artHistoryVisual} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => <i key={i} />)}
        </span>
      )}
      <h3 className={styles.heading}>
        <a href={href} className={styles.link}>
          {title}
          {draft && <span className={styles.draft}>Draft</span>}
        </a>
      </h3>
      <p className={styles.description}>{description}</p>
      {meta && <p className={styles.meta}>{meta}</p>}
    </motion.article>
  );
}

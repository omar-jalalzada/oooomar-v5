import { Card, type CardProps } from './Card';
import styles from './CardGrid.module.css';

type LabCard = Omit<CardProps, 'index'>;

export function LabsGrid({ cards }: { cards: LabCard[] }) {
  return (
    <div className={styles.grid}>
      {cards.map((card, i) => (
        <Card key={card.href} {...card} index={i} />
      ))}
    </div>
  );
}

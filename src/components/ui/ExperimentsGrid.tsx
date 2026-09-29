import { Card, type CardProps } from './Card';
import styles from './CardGrid.module.css';

type CardData = Omit<CardProps, 'index'>;

export function CardGrid({ cards }: { cards: CardData[] }) {
  return (
    <div className={styles.grid}>
      {cards.map((card, i) => (
        <Card key={card.href} {...card} index={i} />
      ))}
    </div>
  );
}

export const ExperimentsGrid = CardGrid;

import { Card, type CardProps } from './Card';
import styles from './CardGrid.module.css';

type ExperimentCard = Omit<CardProps, 'index'>;

export function ExperimentsGrid({ cards }: { cards: ExperimentCard[] }) {
  return (
    <div className={styles.grid}>
      {cards.map((card, i) => (
        <Card key={card.href} {...card} index={i} />
      ))}
    </div>
  );
}

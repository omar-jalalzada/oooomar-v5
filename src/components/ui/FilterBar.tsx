import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Card, type CardProps } from './Card';
import gridStyles from './CardGrid.module.css';
import styles from './FilterBar.module.css';

export interface FilterCardData extends Omit<CardProps, 'index'> {
  topic: string;
}

interface FilterBarProps {
  topics: { value: string; label: string }[];
  cards: FilterCardData[];
  initialTopic?: string;
}

export function FilterBar({ topics, cards, initialTopic = 'all' }: FilterBarProps) {
  const [active, setActive] = useState(initialTopic);

  function handleSelect(topic: string) {
    setActive(topic);
    const url = new URL(window.location.href);
    if (topic === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', topic);
    window.history.replaceState(null, '', url);
  }

  const filtered = active === 'all' ? cards : cards.filter((c) => c.topic === active);

  return (
    <>
      <div className={styles.filter} role="group" aria-label="Filter by topic">
        {topics.map((t) => (
          <button
            key={t.value}
            className={styles.filterBtn}
            aria-pressed={active === t.value}
            onClick={() => handleSelect(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={gridStyles.grid}>
        <AnimatePresence mode="popLayout">
          {filtered.map((card, i) => (
            <Card key={card.href} {...card} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

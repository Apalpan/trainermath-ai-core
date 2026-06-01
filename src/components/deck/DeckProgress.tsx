type DeckProgressProps = {
  current: number;
  total: number;
};

export default function DeckProgress({ current, total }: DeckProgressProps) {
  const progress = (current / total) * 100;

  return (
    <div className="deck-progress" aria-label={`Slide ${current} de ${total}`}>
      <span>{String(current).padStart(2, '0')}</span>
      <div className="deck-progress__track">
        <div className="deck-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <span>{total}</span>
    </div>
  );
}

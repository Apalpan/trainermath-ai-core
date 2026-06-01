import type { DeckSlide } from '../../deck/slides';
import type { CSSProperties } from 'react';
import { lazy, Suspense } from 'react';

const AILiveOrb = lazy(() => import('../ai-mascot/AILiveOrb'));

type VisualMetaphorProps = {
  visual?: DeckSlide['visual'];
};

export default function VisualMetaphor({ visual = 'network' }: VisualMetaphorProps) {
  if (visual === 'orb') {
    return (
      <div className="visual-metaphor visual-metaphor--orb">
        <Suspense fallback={<div className="orb-fallback" />}>
          <AILiveOrb size="lg" view="learning" autoCycle interactive showConnections intensity="medium" />
        </Suspense>
      </div>
    );
  }

  const nodes = Array.from({ length: 18 }, (_, index) => index);

  return (
    <div className={`visual-metaphor visual-metaphor--${visual}`}>
      <div className="visual-metaphor__grid" />
      <div className="visual-metaphor__core" />
      {nodes.map((node) => (
        <span key={node} style={{ '--i': node } as CSSProperties} />
      ))}
      <strong>{visual}</strong>
    </div>
  );
}

import type { DeckSlide } from '../../deck/slides';
import AecodeLogo from './AecodeLogo';
import KeyMetric from './KeyMetric';
import MiniChart from './MiniChart';
import SourceBadge from './SourceBadge';
import SystemDiagram from './SystemDiagram';
import VisualMetaphor from './VisualMetaphor';

type SlideRendererProps = {
  slide: DeckSlide;
  total: number;
};

function SlideHeader({ slide, total }: SlideRendererProps) {
  return (
    <header className="slide-header">
      <AecodeLogo compact />
      <div>
        <span>{slide.chapter}</span>
        <strong>
          {slide.id}/{total}
        </strong>
      </div>
    </header>
  );
}

function SlideFooter({ slide }: { slide: DeckSlide }) {
  return (
    <footer className="slide-footer">
      <SourceBadge source={slide.source} />
      <span>{slide.speakerNote}</span>
    </footer>
  );
}

function ClaimBlock({ slide }: { slide: DeckSlide }) {
  return (
    <div className="claim-block">
      <p>{slide.claim}</p>
      <small>{slide.proof}</small>
    </div>
  );
}

function Items({ items = [] }: { items?: string[] }) {
  return (
    <div className="slide-items">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function Matrix({ slide }: { slide: DeckSlide }) {
  return (
    <div className="matrix-grid">
      {slide.columns?.map((column) => (
        <article key={column.title}>
          <h3>{column.title}</h3>
          {column.items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </article>
      ))}
    </div>
  );
}

function Timeline({ slide }: { slide: DeckSlide }) {
  return (
    <div className="timeline-strip">
      {slide.timeline?.map((item) => (
        <article key={`${item.year}-${item.label}`}>
          <span>{item.year}</span>
          <h3>{item.label}</h3>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

export default function SlideRenderer({ slide, total }: SlideRendererProps) {
  const classes = `deck-slide deck-slide--${slide.layout} accent-${slide.accent ?? 'blue'} ${slide.id === 100 ? 'deck-slide--closing' : ''}`;

  if (slide.layout === 'cover') {
    return (
      <section className={classes}>
        <div className="cover-brand">
          <AecodeLogo tone={slide.id === 100 ? 'light' : 'dark'} />
          <span>{slide.kicker}</span>
        </div>
        <div className="cover-copy">
          <h1>{slide.title}</h1>
          <ClaimBlock slide={slide} />
          {slide.metric && <KeyMetric {...slide.metric} />}
        </div>
        <VisualMetaphor visual={slide.visual} />
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'chapter') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="chapter-marker">
          <span>{String(slide.id).padStart(2, '0')}</span>
          <h1>{slide.title}</h1>
        </div>
        <ClaimBlock slide={slide} />
        {slide.metric && <KeyMetric {...slide.metric} />}
        {slide.visual && <VisualMetaphor visual={slide.visual} />}
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'big-statement') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="statement-copy">
          <span>{slide.chapter}</span>
          <h1>{slide.title}</h1>
          <ClaimBlock slide={slide} />
        </div>
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'data-chart') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="split-layout">
          <div>
            <h2>{slide.title}</h2>
            <ClaimBlock slide={slide} />
            {slide.metric && <KeyMetric {...slide.metric} />}
          </div>
          {slide.chart && <MiniChart {...slide.chart} />}
        </div>
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'quote') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="quote-layout">
          <blockquote>
            <p>{slide.quote?.text ?? slide.claim}</p>
            <cite>
              {slide.quote?.author}
              {slide.quote?.role && <span>{slide.quote.role}</span>}
            </cite>
          </blockquote>
          <ClaimBlock slide={slide} />
        </div>
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'diagram') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="split-layout split-layout--wide">
          <div>
            <h2>{slide.title}</h2>
            <ClaimBlock slide={slide} />
          </div>
          {slide.diagram && <SystemDiagram {...slide.diagram} />}
        </div>
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'image') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <div className="split-layout">
          <div>
            <h2>{slide.title}</h2>
            <ClaimBlock slide={slide} />
          </div>
          <VisualMetaphor visual={slide.visual} />
        </div>
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'matrix') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <h2>{slide.title}</h2>
        <ClaimBlock slide={slide} />
        <Matrix slide={slide} />
        <SlideFooter slide={slide} />
      </section>
    );
  }

  if (slide.layout === 'timeline') {
    return (
      <section className={classes}>
        <SlideHeader slide={slide} total={total} />
        <h2>{slide.title}</h2>
        <ClaimBlock slide={slide} />
        <Timeline slide={slide} />
        <SlideFooter slide={slide} />
      </section>
    );
  }

  return (
    <section className={classes}>
      <SlideHeader slide={slide} total={total} />
      <div className="split-layout">
        <div>
          <h2>{slide.title}</h2>
          <ClaimBlock slide={slide} />
        </div>
        <Items items={slide.items} />
      </div>
      <SlideFooter slide={slide} />
    </section>
  );
}

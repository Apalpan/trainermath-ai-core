import { sourceRegistry, type SourceKey } from '../../deck/slides';

type SourceBadgeProps = {
  source: SourceKey;
};

export default function SourceBadge({ source }: SourceBadgeProps) {
  const item = sourceRegistry[source];

  if (!item.url) {
    return <span className="source-badge">{item.label}</span>;
  }

  return (
    <a className="source-badge source-badge--link" href={item.url} target="_blank" rel="noreferrer">
      {item.label}
    </a>
  );
}

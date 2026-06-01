type KeyMetricProps = {
  value: string;
  label: string;
  helper?: string;
};

export default function KeyMetric({ value, label, helper }: KeyMetricProps) {
  return (
    <div className="key-metric">
      <strong>{value}</strong>
      <span>{label}</span>
      {helper && <small>{helper}</small>}
    </div>
  );
}

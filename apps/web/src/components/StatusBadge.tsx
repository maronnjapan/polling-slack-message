export function StatusBadge({ value }: { value: string | boolean }) {
  return <span className={`badge ${String(value)}`}>{String(value)}</span>;
}

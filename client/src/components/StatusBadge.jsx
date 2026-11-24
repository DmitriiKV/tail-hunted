export default function StatusBadge({ map, status }) {
  const { label, tone } = map[status] || { label: status, tone: "" };
  return <span className={`badge ${tone}`}>{label}</span>;
}

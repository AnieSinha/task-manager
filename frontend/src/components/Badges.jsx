export function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-status-default">—</span>
  const key = status.toLowerCase()
  const cls = key.includes('progress')
    ? 'badge-status-progress'
    : key.includes('done') || key.includes('complete')
    ? 'badge-status-done'
    : key.includes('pending')
    ? 'badge-status-pending'
    : 'badge-status-default'
  return <span className={`badge ${cls}`}>{status}</span>
}

export function PriorityBadge({ priority }) {
  if (!priority) return null
  const key = priority.toLowerCase()
  const cls = key.includes('high')
    ? 'badge-priority-high'
    : key.includes('low')
    ? 'badge-priority-low'
    : 'badge-priority-medium'
  return <span className={`badge ${cls}`}>{priority}</span>
}

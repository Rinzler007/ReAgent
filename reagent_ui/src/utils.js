export function formatDuration(startedAt, finishedAt) {
  if (!finishedAt) return 'running'
  const ms = new Date(finishedAt) - new Date(startedAt)
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatTime(iso) {
  return new Date(iso).toLocaleString()
}

export function buildSpanTree(spans) {
  const byId = {}
  spans.forEach(s => { byId[s.id] = { ...s, children: [] } })
  const roots = []
  spans.forEach(s => {
    if (s.parent_span_id && byId[s.parent_span_id]) {
      byId[s.parent_span_id].children.push(byId[s.id])
    } else {
      roots.push(byId[s.id])
    }
  })
  return roots
}

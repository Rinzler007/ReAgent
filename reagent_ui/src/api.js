const BASE = '/v1'

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || `${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const fetchRuns    = ()               => get('/runs')
export const fetchRun     = (id)             => get(`/runs/${id}`)
export const fetchReplays = (runId)          => get(`/runs/${runId}/replays`)
export const triggerRun   = (question, model) => post('/run', { question, model })

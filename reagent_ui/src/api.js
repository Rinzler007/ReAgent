const BASE = '/v1'

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const fetchRuns = () => get('/runs')
export const fetchRun  = (id) => get(`/runs/${id}`)

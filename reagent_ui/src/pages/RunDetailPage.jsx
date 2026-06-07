import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchRun } from '../api'
import StatusBadge from '../components/StatusBadge'
import SpanNode from '../components/SpanNode'
import { formatDuration, formatTime, buildSpanTree } from '../utils'

export default function RunDetailPage() {
  const { id } = useParams()
  const { data: run, isLoading, isError } = useQuery({
    queryKey: ['run', id],
    queryFn: () => fetchRun(id),
    retry: false,
  })

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            ← All runs
          </Link>
        </div>

        {isLoading && <p className="text-slate-400 text-sm">Loading...</p>}

        {isError && <p className="text-red-400 text-sm">Run not found.</p>}

        {run && (
          <>
            <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={run.status} />
                <h2 className="text-lg font-semibold text-white">{run.agent_name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <Row label="Started"  value={formatTime(run.started_at)} />
                <Row label="Duration" value={formatDuration(run.started_at, run.finished_at)} />
                <Row label="Spans"    value={run.span_count} />
                {run.total_tokens && <Row label="Tokens" value={run.total_tokens} />}
                {run.total_cost_usd && <Row label="Cost" value={`$${run.total_cost_usd}`} />}
              </div>

              {Object.keys(run.metadata ?? {}).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">metadata</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(run.metadata).map(([k, v]) => (
                      <span key={k} className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
                Span tree
              </h3>
              {run.spans?.length === 0 && (
                <p className="text-slate-500 text-sm">No spans recorded for this run.</p>
              )}
              {buildSpanTree(run.spans ?? []).map(root => (
                <SpanNode key={root.id} span={root} depth={0} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <>
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </>
  )
}

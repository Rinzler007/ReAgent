import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchRun, fetchReplays } from '../api'
import StatusBadge from '../components/StatusBadge'
import SpanNode from '../components/SpanNode'
import DotsPattern from '../components/DotsPattern'
import { formatDuration, formatTime, buildSpanTree } from '../utils'

export default function RunDetailPage() {
  const { id } = useParams()

  const { data: run, isLoading, isError } = useQuery({
    queryKey: ['run', id],
    queryFn: () => fetchRun(id),
    retry: false,
  })

  const { data: replays } = useQuery({
    queryKey: ['replays', id],
    queryFn: () => fetchReplays(id),
    retry: false,
  })

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <DotsPattern id="detail-dots" opacity={0.14} />
      <div className="absolute top-24 left-10 w-64 h-64 rounded-full bg-[#4285F4]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-16 w-72 h-72 rounded-full bg-[#FBBC05]/6 blur-3xl pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" className="font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            ReAgent
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <Link to="/explorer" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            All runs
          </Link>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto p-6">
        {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
        {isError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">Run not found.</p>
          </div>
        )}

        {run && (
          <>
            <div className="mb-6 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={run.status} />
                <h2 className="text-lg font-semibold text-gray-900">{run.agent_name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                <Row label="Started"  value={formatTime(run.started_at)} />
                <Row label="Duration" value={formatDuration(run.started_at, run.finished_at)} />
                <Row label="Spans"    value={run.span_count} />
                {run.total_tokens   && <Row label="Tokens" value={run.total_tokens} />}
                {run.total_cost_usd && <Row label="Cost"   value={`$${run.total_cost_usd}`} />}
              </div>

              {Object.keys(run.metadata ?? {}).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">metadata</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(run.metadata).map(([k, v]) => (
                      <span key={k} className="text-xs font-mono bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {replays && replays.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Replays
                </h3>
                {replays.map(diff => (
                  <Link
                    key={diff.id}
                    to={`/runs/${id}/replays/${diff.id}`}
                    className="flex items-center justify-between p-3 mb-2 rounded-lg
                      bg-white border border-gray-200 shadow-sm hover:border-sky-300 hover:shadow-md transition-all"
                  >
                    <div className="text-sm text-gray-600">
                      {formatTime(diff.created_at)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{diff.summary.llm_output_changes ?? 0} LLM outputs changed</span>
                      <span>{diff.summary.original_tool_calls ?? 0} tool calls fixtured</span>
                      <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent font-medium">View diff</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Span tree
              </h3>
              {run.spans?.length === 0 && (
                <p className="text-gray-400 text-sm">No spans recorded for this run.</p>
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
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700">{value}</span>
    </>
  )
}
